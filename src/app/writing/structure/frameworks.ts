export interface Beat {
  id: string
  name: string
  description: string
  pageRange: string
  type: 'internal' | 'external'
  percentage: number
}

export interface Framework {
  id: string
  name: string
  description: string
  beats: Beat[]
  examples?: string[]
}

export const storyFrameworks: Framework[] = [
  {
    id: 'save-the-cat',
    name: "Blake Snyder's Save the Cat",
    description: "A 15-beat structure that emphasizes audience connection and commercial appeal",
    examples: ["Star Wars", "Die Hard", "The Dark Knight"],
    beats: [
      {
        id: 'stc-opening-image',
        name: 'Opening Image',
        description: 'A visual that represents the struggle & tone of the story. A snapshot of the main character\'s problem, before the adventure begins.',
        pageRange: 'Page 1',
        type: 'external',
        percentage: 1
      },
      {
        id: 'stc-setup',
        name: 'Setup',
        description: 'Expand on the opening image. Present the main character\'s world as it is, and what is missing in their life.',
        pageRange: 'Pages 1-10',
        type: 'external',
        percentage: 10
      },
      {
        id: 'stc-theme-stated',
        name: 'Theme Stated',
        description: 'What your story is about. Usually spoken to the main character by someone else.',
        pageRange: 'Page 5',
        type: 'internal',
        percentage: 5
      },
      {
        id: 'stc-catalyst',
        name: 'Catalyst',
        description: 'The moment where life as it is changes. It is the telegram, the act of catching your loved-one cheating, allowing a monster onboard the ship.',
        pageRange: 'Page 12',
        type: 'external',
        percentage: 12
      },
      {
        id: 'stc-debate',
        name: 'Debate',
        description: 'The hero doubts the journey they must take. Can they face this challenge? Do they have what it takes?',
        pageRange: 'Pages 12-25',
        type: 'internal',
        percentage: 20
      },
      {
        id: 'stc-break-into-two',
        name: 'Break Into Two',
        description: 'The main character makes a choice and the journey begins. We leave the Thesis world and enter the upside-down Anti-thesis world.',
        pageRange: 'Page 25',
        type: 'external',
        percentage: 25
      },
      {
        id: 'stc-b-story',
        name: 'B Story',
        description: 'A story that runs parallel to the main story, often a love interest story that carries the theme.',
        pageRange: 'Page 30',
        type: 'internal',
        percentage: 30
      },
      {
        id: 'stc-fun-games',
        name: 'Fun and Games',
        description: 'The promise of the premise. This is when the audience is entertained with what they came to see.',
        pageRange: 'Pages 30-55',
        type: 'external',
        percentage: 42
      },
      {
        id: 'stc-midpoint',
        name: 'Midpoint',
        description: 'Dependent upon the story, this moment is when everything is great or everything is awful. Time to raise the stakes.',
        pageRange: 'Page 55',
        type: 'external',
        percentage: 50
      },
      {
        id: 'stc-bad-guys-close',
        name: 'Bad Guys Close In',
        description: 'Double down on the stakes. Internal dissent, doubt, jealousy & fear disintegrate the hero\'s team.',
        pageRange: 'Pages 55-75',
        type: 'external',
        percentage: 65
      },
      {
        id: 'stc-all-lost',
        name: 'All Is Lost',
        description: 'The opposite moment from the Midpoint. The moment that the main character realizes they\'ve lost everything.',
        pageRange: 'Page 75',
        type: 'internal',
        percentage: 75
      },
      {
        id: 'stc-dark-night',
        name: 'Dark Night of the Soul',
        description: 'The main character hits bottom, mourning their loss. But they must choose to continue or give up.',
        pageRange: 'Pages 75-85',
        type: 'internal',
        percentage: 80
      },
      {
        id: 'stc-break-into-three',
        name: 'Break Into Three',
        description: 'The hero chooses to try again. With newfound resolve and the help of the B Story, the hero tries again.',
        pageRange: 'Page 85',
        type: 'external',
        percentage: 85
      },
      {
        id: 'stc-finale',
        name: 'Finale',
        description: 'The climax. Hero conquers villain, the old world is destroyed and a new world is created.',
        pageRange: 'Pages 85-110',
        type: 'external',
        percentage: 95
      },
      {
        id: 'stc-final-image',
        name: 'Final Image',
        description: 'The opposite of the Opening Image, proving that change has occurred.',
        pageRange: 'Page 110',
        type: 'external',
        percentage: 100
      }
    ]
  },
  {
    id: 'syd-field',
    name: "Syd Field's Paradigm",
    description: "The classic three-act structure that revolutionized screenplay analysis",
    examples: ["Chinatown", "The Godfather", "Tootsie"],
    beats: [
      {
        id: 'sf-setup',
        name: 'Setup (Act I)',
        description: 'Establish main character, dramatic premise, and situation. Create the context for the story.',
        pageRange: 'Pages 1-30',
        type: 'external',
        percentage: 25
      },
      {
        id: 'sf-inciting',
        name: 'Inciting Incident',
        description: 'The event that sets the story in motion.',
        pageRange: 'Pages 10-15',
        type: 'external',
        percentage: 12
      },
      {
        id: 'sf-plot-point-1',
        name: 'Plot Point I',
        description: 'A major event that spins the story in a new direction, leading into Act II.',
        pageRange: 'Pages 25-30',
        type: 'external',
        percentage: 25
      },
      {
        id: 'sf-confrontation',
        name: 'Confrontation (Act II)',
        description: 'The main character encounters obstacles that prevent them from achieving their goal.',
        pageRange: 'Pages 30-90',
        type: 'external',
        percentage: 60
      },
      {
        id: 'sf-midpoint',
        name: 'Midpoint',
        description: 'A reversal that changes the direction of Act II.',
        pageRange: 'Page 60',
        type: 'external',
        percentage: 50
      },
      {
        id: 'sf-plot-point-2',
        name: 'Plot Point II',
        description: 'Another major event that spins the story toward the resolution.',
        pageRange: 'Pages 85-90',
        type: 'external',
        percentage: 75
      },
      {
        id: 'sf-resolution',
        name: 'Resolution (Act III)',
        description: 'The climax and resolution of the story. All loose ends are tied up.',
        pageRange: 'Pages 90-120',
        type: 'external',
        percentage: 100
      }
    ]
  },
  {
    id: 'hero-journey',
    name: "Christopher Vogler's Hero's Journey",
    description: "Joseph Campbell's monomyth adapted for modern screenwriting",
    examples: ["The Matrix", "Lord of the Rings", "Harry Potter"],
    beats: [
      {
        id: 'hj-ordinary',
        name: 'Ordinary World',
        description: 'The hero\'s normal life before the story begins.',
        pageRange: 'Pages 1-10',
        type: 'external',
        percentage: 8
      },
      {
        id: 'hj-call',
        name: 'Call to Adventure',
        description: 'The hero is presented with a problem, challenge, or adventure.',
        pageRange: 'Pages 10-15',
        type: 'external',
        percentage: 12
      },
      {
        id: 'hj-refusal',
        name: 'Refusal of the Call',
        description: 'The hero fears the unknown and tries to turn away from the adventure.',
        pageRange: 'Pages 15-20',
        type: 'internal',
        percentage: 16
      },
      {
        id: 'hj-mentor',
        name: 'Meeting the Mentor',
        description: 'The hero encounters a wise figure who gives advice and magical gifts.',
        pageRange: 'Pages 20-25',
        type: 'external',
        percentage: 20
      },
      {
        id: 'hj-threshold',
        name: 'Crossing the Threshold',
        description: 'The hero commits to the adventure and enters the Special World.',
        pageRange: 'Pages 25-30',
        type: 'external',
        percentage: 25
      },
      {
        id: 'hj-tests',
        name: 'Tests, Allies, and Enemies',
        description: 'The hero faces tests and makes allies and enemies in the Special World.',
        pageRange: 'Pages 30-60',
        type: 'external',
        percentage: 45
      },
      {
        id: 'hj-approach',
        name: 'Approach to the Inmost Cave',
        description: 'The hero prepares for the major challenge in the Special World.',
        pageRange: 'Pages 60-70',
        type: 'internal',
        percentage: 58
      },
      {
        id: 'hj-ordeal',
        name: 'Ordeal',
        description: 'The hero faces their greatest fear or most deadly enemy.',
        pageRange: 'Pages 70-80',
        type: 'external',
        percentage: 65
      },
      {
        id: 'hj-reward',
        name: 'Reward (Seizing the Sword)',
        description: 'The hero survives and gains the reward.',
        pageRange: 'Pages 80-85',
        type: 'external',
        percentage: 75
      },
      {
        id: 'hj-road-back',
        name: 'The Road Back',
        description: 'The hero begins the journey back to the ordinary world.',
        pageRange: 'Pages 85-95',
        type: 'external',
        percentage: 85
      },
      {
        id: 'hj-resurrection',
        name: 'Resurrection',
        description: 'The climax. The hero faces a final test, using everything they\'ve learned.',
        pageRange: 'Pages 95-110',
        type: 'external',
        percentage: 95
      },
      {
        id: 'hj-return',
        name: 'Return with the Elixir',
        description: 'The hero returns to the ordinary world with a treasure to benefit their world.',
        pageRange: 'Pages 110-120',
        type: 'external',
        percentage: 100
      }
    ]
  },
  {
    id: 'nutshell',
    name: "Jill Chamberlain's Nutshell Technique",
    description: "An 8-element system focusing on the protagonist\'s flaw and transformation",
    examples: ["Casablanca", "Silver Linings Playbook", "Little Miss Sunshine"],
    beats: [
      {
        id: 'ns-setup',
        name: 'Set-up Want',
        description: 'What the protagonist wants at the beginning of the story.',
        pageRange: 'Pages 1-10',
        type: 'external',
        percentage: 8
      },
      {
        id: 'ns-point-sync',
        name: 'Point of Synchronicity',
        description: 'The seemingly random event that sets the story in motion.',
        pageRange: 'Pages 10-15',
        type: 'external',
        percentage: 12
      },
      {
        id: 'ns-flaw',
        name: 'Flaw',
        description: 'The protagonist\'s main character flaw that needs to be overcome.',
        pageRange: 'Established early',
        type: 'internal',
        percentage: 10
      },
      {
        id: 'ns-crisis',
        name: 'Crisis',
        description: 'The moment when the protagonist must face their flaw.',
        pageRange: 'Pages 75-85',
        type: 'internal',
        percentage: 75
      },
      {
        id: 'ns-choice',
        name: 'Choice',
        description: 'The difficult decision the protagonist must make at the Crisis.',
        pageRange: 'Pages 85-90',
        type: 'internal',
        percentage: 80
      },
      {
        id: 'ns-climax',
        name: 'Climactic Choice',
        description: 'The final choice that demonstrates the protagonist\'s transformation.',
        pageRange: 'Pages 95-105',
        type: 'external',
        percentage: 90
      },
      {
        id: 'ns-catch',
        name: 'Catch',
        description: 'The ironic connection between the Set-up Want and what actually happens.',
        pageRange: 'Revealed at end',
        type: 'internal',
        percentage: 95
      },
      {
        id: 'ns-payoff',
        name: 'Final Payoff',
        description: 'The resolution showing how the protagonist has changed.',
        pageRange: 'Pages 105-120',
        type: 'external',
        percentage: 100
      }
    ]
  },
  {
    id: 'six-stage',
    name: "Michael Hauge's Six-Stage Plot Structure",
    description: "A character arc-focused structure emphasizing inner and outer journey",
    examples: ["Shrek", "The Karate Kid", "Gladiator"],
    beats: [
      {
        id: 'mh-setup',
        name: 'Stage 1: Setup',
        description: 'Introduction to the hero\'s everyday life, wound, and identity.',
        pageRange: 'Pages 1-10',
        type: 'external',
        percentage: 10
      },
      {
        id: 'mh-opportunity',
        name: 'Turning Point 1: Opportunity',
        description: 'Something happens to create desire and opportunity.',
        pageRange: 'Pages 10-15',
        type: 'external',
        percentage: 10
      },
      {
        id: 'mh-new-situation',
        name: 'Stage 2: New Situation',
        description: 'Hero reacts to the new situation, glimpses their essence.',
        pageRange: 'Pages 15-25',
        type: 'internal',
        percentage: 25
      },
      {
        id: 'mh-change-plans',
        name: 'Turning Point 2: Change of Plans',
        description: 'Hero commits to the goal, no turning back.',
        pageRange: 'Page 25',
        type: 'external',
        percentage: 25
      },
      {
        id: 'mh-progress',
        name: 'Stage 3: Progress',
        description: 'Hero makes progress toward the outer goal, identity intact.',
        pageRange: 'Pages 25-50',
        type: 'external',
        percentage: 50
      },
      {
        id: 'mh-point-no-return',
        name: 'Turning Point 3: Point of No Return',
        description: 'Hero must fully commit, burn bridges.',
        pageRange: 'Page 50',
        type: 'internal',
        percentage: 50
      },
      {
        id: 'mh-complications',
        name: 'Stage 4: Complications and Higher Stakes',
        description: 'Hero moves toward essence but faces greater obstacles.',
        pageRange: 'Pages 50-75',
        type: 'external',
        percentage: 75
      },
      {
        id: 'mh-major-setback',
        name: 'Turning Point 4: Major Setback',
        description: 'All seems lost, hero must dig deep.',
        pageRange: 'Page 75',
        type: 'internal',
        percentage: 75
      },
      {
        id: 'mh-final-push',
        name: 'Stage 5: Final Push',
        description: 'Hero musters courage to achieve the goal.',
        pageRange: 'Pages 75-90',
        type: 'external',
        percentage: 90
      },
      {
        id: 'mh-climax',
        name: 'Turning Point 5: Climax',
        description: 'Hero must choose essence over identity.',
        pageRange: 'Pages 90-95',
        type: 'internal',
        percentage: 90
      },
      {
        id: 'mh-aftermath',
        name: 'Stage 6: Aftermath',
        description: 'We see the hero\'s new life, living their truth.',
        pageRange: 'Pages 95-110',
        type: 'external',
        percentage: 100
      }
    ]
  },
  {
    id: 'story-circle',
    name: "Dan Harmon's Story Circle",
    description: "A simplified version of the Hero's Journey in 8 steps",
    examples: ["Community episodes", "Rick and Morty", "Monster House"],
    beats: [
      {
        id: 'sc-you',
        name: '1. You (Comfort Zone)',
        description: 'A character in their comfort zone.',
        pageRange: 'Pages 1-15',
        type: 'external',
        percentage: 12
      },
      {
        id: 'sc-need',
        name: '2. Need',
        description: 'They want something.',
        pageRange: 'Pages 15-20',
        type: 'internal',
        percentage: 17
      },
      {
        id: 'sc-go',
        name: '3. Go',
        description: 'They enter an unfamiliar situation.',
        pageRange: 'Pages 20-30',
        type: 'external',
        percentage: 25
      },
      {
        id: 'sc-search',
        name: '4. Search',
        description: 'They adapt to that situation.',
        pageRange: 'Pages 30-50',
        type: 'external',
        percentage: 42
      },
      {
        id: 'sc-find',
        name: '5. Find',
        description: 'They get what they wanted.',
        pageRange: 'Pages 50-70',
        type: 'external',
        percentage: 58
      },
      {
        id: 'sc-take',
        name: '6. Take',
        description: 'They pay a heavy price for it.',
        pageRange: 'Pages 70-85',
        type: 'internal',
        percentage: 75
      },
      {
        id: 'sc-return',
        name: '7. Return',
        description: 'They return to their familiar situation.',
        pageRange: 'Pages 85-100',
        type: 'external',
        percentage: 85
      },
      {
        id: 'sc-change',
        name: '8. Change',
        description: 'Having changed.',
        pageRange: 'Pages 100-110',
        type: 'internal',
        percentage: 100
      }
    ]
  },
  {
    id: 'sequence-method',
    name: "The Sequence Method",
    description: "Eight 10-15 minute sequences, each with its own beginning, middle, and end",
    examples: ["North by Northwest", "Raiders of the Lost Ark", "The Fugitive"],
    beats: [
      {
        id: 'seq-1',
        name: 'Sequence 1: Status Quo & Inciting Incident',
        description: 'Establish the protagonist\'s world and the event that disrupts it.',
        pageRange: 'Pages 1-15',
        type: 'external',
        percentage: 12
      },
      {
        id: 'seq-2',
        name: 'Sequence 2: Predicament & Lock-In',
        description: 'The protagonist tries to restore the status quo but gets locked into the conflict.',
        pageRange: 'Pages 15-30',
        type: 'external',
        percentage: 25
      },
      {
        id: 'seq-3',
        name: 'Sequence 3: First Attempts',
        description: 'The protagonist\'s first attempts to solve the problem.',
        pageRange: 'Pages 30-45',
        type: 'external',
        percentage: 37
      },
      {
        id: 'seq-4',
        name: 'Sequence 4: First Culmination/Midpoint',
        description: 'A major success or failure that changes the game.',
        pageRange: 'Pages 45-60',
        type: 'external',
        percentage: 50
      },
      {
        id: 'seq-5',
        name: 'Sequence 5: Complications',
        description: 'Things get worse, stakes rise.',
        pageRange: 'Pages 60-75',
        type: 'external',
        percentage: 62
      },
      {
        id: 'seq-6',
        name: 'Sequence 6: Second Culmination',
        description: 'All seems lost, lowest point.',
        pageRange: 'Pages 75-90',
        type: 'internal',
        percentage: 75
      },
      {
        id: 'seq-7',
        name: 'Sequence 7: New Tension',
        description: 'The final push toward the climax.',
        pageRange: 'Pages 90-105',
        type: 'external',
        percentage: 87
      },
      {
        id: 'seq-8',
        name: 'Sequence 8: Resolution',
        description: 'The climax and denouement.',
        pageRange: 'Pages 105-120',
        type: 'external',
        percentage: 100
      }
    ]
  },
  {
    id: 'tv-structure',
    name: "TV Drama Structure (Teaser + 5 Acts)",
    description: "Standard hour-long TV drama structure with commercial breaks in mind",
    examples: ["Breaking Bad", "The Sopranos", "Mad Men"],
    beats: [
      {
        id: 'tv-teaser',
        name: 'Teaser',
        description: 'Hook the audience with action or mystery.',
        pageRange: 'Pages 1-3',
        type: 'external',
        percentage: 5
      },
      {
        id: 'tv-act1',
        name: 'Act 1: Setup',
        description: 'Establish the episode\'s central conflict.',
        pageRange: 'Pages 4-13',
        type: 'external',
        percentage: 20
      },
      {
        id: 'tv-act2',
        name: 'Act 2: Complications',
        description: 'The problem gets more complex.',
        pageRange: 'Pages 14-24',
        type: 'external',
        percentage: 40
      },
      {
        id: 'tv-act3',
        name: 'Act 3: Escalation',
        description: 'Stakes rise, midpoint twist.',
        pageRange: 'Pages 25-35',
        type: 'external',
        percentage: 60
      },
      {
        id: 'tv-act4',
        name: 'Act 4: Confrontation',
        description: 'Direct confrontation with the problem.',
        pageRange: 'Pages 36-46',
        type: 'external',
        percentage: 80
      },
      {
        id: 'tv-act5',
        name: 'Act 5: Resolution',
        description: 'Climax and setup for next episode.',
        pageRange: 'Pages 47-55',
        type: 'external',
        percentage: 100
      }
    ]
  }
]