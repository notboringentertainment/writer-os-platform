export interface Character {
  name: string
  firstAppearance: number // element index
  actions: string[]
  dialogues: string[]
  relationships: Map<string, string> // character -> relationship type
  currentLocation?: string
  lastAction?: string
}

export interface Location {
  name: string
  type: 'INT' | 'EXT' | 'INT/EXT'
  timeOfDay?: string
  scenes: number[] // element indices
}

export interface Prop {
  name: string
  firstMention: number
  lastSeen: number
  associatedCharacters: string[]
}

export interface SceneEvent {
  elementIndex: number
  type: 'action' | 'dialogue' | 'movement'
  character?: string
  location?: string
  description: string
}

export interface KnowledgeGraph {
  characters: Map<string, Character>
  locations: Map<string, Location>
  props: Map<string, Prop>
  timeline: SceneEvent[]
  currentScene?: Location
}

export interface ContinuityError {
  type: 'character_inconsistency' | 'timeline_conflict' | 'location_impossible' | 'prop_inconsistency'
  elementIndex: number
  message: string
  severity: 'warning' | 'error'
}

export interface ScriptElement {
  id: string
  type: 'scene_heading' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition' | 'shot'
  content: string
}

export class ScreenplayParser {
  private knowledgeGraph: KnowledgeGraph = {
    characters: new Map(),
    locations: new Map(),
    props: new Map(),
    timeline: []
  }

  private continuityErrors: ContinuityError[] = []

  parseScreenplay(elements: ScriptElement[]): { knowledgeGraph: KnowledgeGraph; errors: ContinuityError[] } {
    this.reset()
    
    let currentCharacter: string | null = null
    let currentLocation: Location | null = null

    elements.forEach((element, index) => {
      switch (element.type) {
        case 'scene_heading':
          this.parseSceneHeading(element.content, index)
          currentLocation = this.knowledgeGraph.currentScene || null
          break
        
        case 'character':
          currentCharacter = this.parseCharacterName(element.content, index)
          break
        
        case 'dialogue':
          if (currentCharacter) {
            this.parseDialogue(currentCharacter, element.content, index)
          }
          break
        
        case 'action':
          this.parseAction(element.content, index, currentLocation)
          break
        
        case 'parenthetical':
          if (currentCharacter) {
            this.parseParenthetical(currentCharacter, element.content)
          }
          break
      }
    })

    this.checkContinuity()
    return { knowledgeGraph: this.knowledgeGraph, errors: this.continuityErrors }
  }

  private reset() {
    this.knowledgeGraph = {
      characters: new Map(),
      locations: new Map(),
      props: new Map(),
      timeline: []
    }
    this.continuityErrors = []
  }

  private parseSceneHeading(content: string, index: number) {
    const match = content.match(/^(INT\.|EXT\.|INT\/EXT\.)\s+(.+?)(?:\s+-\s+(.+))?$/)
    if (match) {
      const [, type, locationName, timeOfDay] = match
      const location: Location = {
        name: locationName.trim(),
        type: type.replace('.', '') as 'INT' | 'EXT' | 'INT/EXT',
        timeOfDay: timeOfDay?.trim(),
        scenes: []
      }
      
      if (this.knowledgeGraph.locations.has(location.name)) {
        const existing = this.knowledgeGraph.locations.get(location.name)!
        existing.scenes.push(index)
      } else {
        location.scenes.push(index)
        this.knowledgeGraph.locations.set(location.name, location)
      }
      
      this.knowledgeGraph.currentScene = location
    }
  }

  private parseCharacterName(content: string, index: number): string {
    const name = content.trim().replace(/\s*\(.*\)$/, '') // Remove (V.O.), (O.S.), etc.
    
    if (!this.knowledgeGraph.characters.has(name)) {
      this.knowledgeGraph.characters.set(name, {
        name,
        firstAppearance: index,
        actions: [],
        dialogues: [],
        relationships: new Map(),
        currentLocation: this.knowledgeGraph.currentScene?.name
      })
    }
    
    return name
  }

  private parseDialogue(character: string, content: string, index: number) {
    const char = this.knowledgeGraph.characters.get(character)
    if (char) {
      char.dialogues.push(content)
      this.knowledgeGraph.timeline.push({
        elementIndex: index,
        type: 'dialogue',
        character,
        location: this.knowledgeGraph.currentScene?.name,
        description: content
      })
    }
  }

  private parseAction(content: string, index: number, location: Location | null) {
    // Extract character names from action (simple heuristic: capitalized words)
    const characterMatches = content.match(/\b[A-Z][a-z]+\b/g) || []
    
    characterMatches.forEach(name => {
      if (this.knowledgeGraph.characters.has(name)) {
        const char = this.knowledgeGraph.characters.get(name)!
        char.actions.push(content)
        char.lastAction = content
        char.currentLocation = location?.name
        
        this.knowledgeGraph.timeline.push({
          elementIndex: index,
          type: 'action',
          character: name,
          location: location?.name,
          description: content
        })
      }
    })

    // Extract potential props (simple heuristic: look for common objects)
    this.extractProps(content, index)
  }

  private parseParenthetical(character: string, content: string) {
    const char = this.knowledgeGraph.characters.get(character)
    if (char) {
      char.actions.push(`(${content})`)
    }
  }

  private extractProps(content: string, index: number) {
    // Simple prop extraction - look for common patterns
    const propPatterns = [
      /(?:picks up|holds|grabs|takes|drops|throws|uses|opens|closes)\s+(?:the\s+)?(\w+)/gi,
      /(?:with|holding|carrying)\s+(?:a|an|the)\s+(\w+)/gi
    ]
    
    propPatterns.forEach(pattern => {
      let match
      while ((match = pattern.exec(content)) !== null) {
        const propName = match[1].toLowerCase()
        if (!this.knowledgeGraph.props.has(propName)) {
          this.knowledgeGraph.props.set(propName, {
            name: propName,
            firstMention: index,
            lastSeen: index,
            associatedCharacters: []
          })
        } else {
          const prop = this.knowledgeGraph.props.get(propName)!
          prop.lastSeen = index
        }
      }
    })
  }

  private checkContinuity() {
    // Check for character location inconsistencies
    this.knowledgeGraph.characters.forEach(character => {
      let lastLocation: string | undefined
      let lastLocationIndex = -1
      
      this.knowledgeGraph.timeline.forEach(event => {
        if (event.character === character.name && event.location) {
          if (lastLocation && lastLocation !== event.location) {
            // Check if there was a scene change between appearances
            let hasSceneChange = false
            for (let i = lastLocationIndex + 1; i < event.elementIndex; i++) {
              if (this.knowledgeGraph.timeline.some(e => 
                e.elementIndex === i && e.type === 'action' && 
                (e.description.includes('exits') || e.description.includes('leaves'))
              )) {
                hasSceneChange = true
                break
              }
            }
            
            if (!hasSceneChange) {
              this.continuityErrors.push({
                type: 'location_impossible',
                elementIndex: event.elementIndex,
                message: `${character.name} appears in ${event.location} without leaving ${lastLocation}`,
                severity: 'warning'
              })
            }
          }
          lastLocation = event.location
          lastLocationIndex = event.elementIndex
        }
      })
    })

    // Check for action inconsistencies
    this.checkActionContinuity()
  }

  private checkActionContinuity() {
    // Example: Check for transportation inconsistencies
    const transportPattern = /(\w+)\s+(enters|exits|gets in|gets out of|boards|leaves)\s+(?:the\s+)?(\w+)/gi
    
    this.knowledgeGraph.timeline.forEach(event => {
      if (event.type === 'action' && event.character) {
        let match
        while ((match = transportPattern.exec(event.description)) !== null) {
          const [, character, action, vehicle] = match
          
          // Simple check: if someone exits a train but entered a bus
          const previousTransport = this.findPreviousTransport(character, event.elementIndex)
          if (previousTransport && previousTransport !== vehicle && 
              (action === 'exits' || action === 'gets out of' || action === 'leaves')) {
            this.continuityErrors.push({
              type: 'character_inconsistency',
              elementIndex: event.elementIndex,
              message: `${character} exits ${vehicle} but previously entered ${previousTransport}`,
              severity: 'error'
            })
          }
        }
      }
    })
  }

  private findPreviousTransport(character: string, beforeIndex: number): string | null {
    const enterPattern = /enters|gets in|boards/i
    
    for (let i = beforeIndex - 1; i >= 0; i--) {
      const event = this.knowledgeGraph.timeline.find(e => e.elementIndex === i)
      if (event && event.character === character && event.type === 'action') {
        if (enterPattern.test(event.description)) {
          const match = event.description.match(/(?:enters|gets in|boards)\s+(?:the\s+)?(\w+)/i)
          return match ? match[1] : null
        }
      }
    }
    return null
  }

  getCharacterInfo(name: string): Character | undefined {
    return this.knowledgeGraph.characters.get(name)
  }

  getCurrentScene(): Location | undefined {
    return this.knowledgeGraph.currentScene
  }

  getRecentEvents(count: number = 5): SceneEvent[] {
    return this.knowledgeGraph.timeline.slice(-count)
  }
}