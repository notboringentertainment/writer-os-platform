export interface MovieExample {
  id: string
  title: string
  framework: string
  beats: { [beatId: string]: string }
}

export const movieExamples: MovieExample[] = [
  // Save the Cat Examples
  {
    id: 'star-wars-stc',
    title: 'Star Wars',
    framework: 'save-the-cat',
    beats: {
      'stc-opening-image': 'A small Rebel ship is pursued by a massive Imperial Star Destroyer. The Empire\'s overwhelming power is established as Darth Vader boards the ship.',
      'stc-setup': 'Luke Skywalker lives a boring life on Tatooine with his aunt and uncle, dreaming of adventure and joining the Imperial Academy. We see his frustration with his mundane existence.',
      'stc-theme-stated': 'Obi-Wan tells Luke about the Force: "It surrounds us, penetrates us, binds the galaxy together." This mystical power will be what Luke must learn to trust.',
      'stc-catalyst': 'R2-D2 plays Princess Leia\'s holographic message: "Help me Obi-Wan Kenobi, you\'re my only hope." This pulls Luke into the larger galactic conflict.',
      'stc-debate': 'Luke initially refuses the call to adventure, saying he has responsibilities on the farm. But after the Empire kills his aunt and uncle, he has nothing left to keep him on Tatooine.',
      'stc-break-into-two': 'Luke decides to go with Obi-Wan to Alderaan and learn the ways of the Force. He leaves his old life behind and enters the larger galaxy.',
      'stc-b-story': 'Luke\'s relationships with Han Solo and Princess Leia develop. Han represents the cynical mercenary Luke could become, while Leia shows dedication to a cause greater than herself.',
      'stc-fun-games': 'The cantina scene, hiring Han Solo, escaping Tatooine, rescuing Princess Leia from the Death Star, the trash compactor scene - all the adventure Luke dreamed of.',
      'stc-midpoint': 'Obi-Wan sacrifices himself in a lightsaber duel with Darth Vader, leaving Luke without his mentor. Stakes are raised as Luke must now trust the Force on his own.',
      'stc-bad-guys-close': 'The Death Star follows the heroes to the Rebel base. The Empire prepares to destroy the Rebellion once and for all. Time is running out.',
      'stc-all-lost': 'During the attack on the Death Star, Rebel pilots are being picked off one by one. Luke\'s targeting computer is damaged. It seems impossible to succeed.',
      'stc-dark-night': 'Luke is alone in his X-wing, with Vader closing in. His friends are dying around him. He must choose between technology and trusting the Force.',
      'stc-break-into-three': 'Luke hears Obi-Wan\'s voice: "Use the Force, Luke." He switches off his targeting computer, choosing faith over technology.',
      'stc-finale': 'Han Solo returns to save Luke from Vader. Luke successfully destroys the Death Star using the Force, saving the Rebellion.',
      'stc-final-image': 'Luke, no longer a farm boy but a hero of the Rebellion, receives a medal from Princess Leia as the Rebels celebrate their victory.'
    }
  },
  {
    id: 'die-hard-stc',
    title: 'Die Hard',
    framework: 'save-the-cat',
    beats: {
      'stc-opening-image': 'John McClane, afraid of flying, grips his seat on the plane. A fellow passenger gives him advice about making fists with his toes. John is out of his element.',
      'stc-setup': 'John arrives in LA to reconcile with his estranged wife Holly at her company Christmas party. Their relationship is strained, and John feels like an outsider.',
      'stc-theme-stated': 'The theme of connection and what really matters is established through John\'s desire to reunite with his family for Christmas.',
      'stc-catalyst': 'Hans Gruber and his team take over Nakatomi Plaza, holding everyone hostage. John, barefoot in the bathroom, escapes detection.',
      'stc-debate': 'Should John hide and wait for help, or take action? He\'s one man against a team of terrorists, with no shoes and only his service weapon.',
      'stc-break-into-two': 'John decides to take action, pulling a fire alarm to alert authorities. He commits to being the fly in the ointment.',
      'stc-b-story': 'John\'s radio relationship with Sgt. Al Powell develops. Al becomes his only connection to the outside world and his emotional support.',
      'stc-fun-games': 'John picks off terrorists one by one, using guerrilla tactics. "Now I have a machine gun. Ho ho ho." The cat-and-mouse game with Hans.',
      'stc-midpoint': 'John discovers Hans\'s real plan - to steal $640 million in bearer bonds. The stakes are raised from simple terrorism to an elaborate heist.',
      'stc-bad-guys-close': 'The FBI arrives and plays into Hans\'s plan. John is now fighting both the terrorists and the authorities\' incompetence. His feet are shredded by glass.',
      'stc-all-lost': 'Hans discovers Holly is John\'s wife and takes her personally hostage. John seems to have no leverage left.',
      'stc-dark-night': 'John, bloodied and beaten, confesses his failures to Al over the radio. He faces his fear of expressing emotions and asks Al to tell Holly he\'s sorry.',
      'stc-break-into-three': 'John realizes he has two bullets left and tape. He tapes the gun to his back - his last desperate gambit.',
      'stc-finale': 'John confronts Hans, using his hidden gun to shoot Hans and his accomplice. Hans falls from the building, and Holly is saved.',
      'stc-final-image': 'John and Holly leave together, their relationship renewed. John has overcome his emotional distance and they\'re a couple again.'
    }
  },

  // Hero's Journey Examples
  {
    id: 'matrix-hero',
    title: 'The Matrix',
    framework: 'hero-journey',
    beats: {
      'hj-ordinary': 'Thomas Anderson lives a double life as a corporate programmer by day and hacker "Neo" by night. He feels something is wrong with the world but can\'t explain it.',
      'hj-call': 'Trinity contacts Neo: "The Matrix has you." Morpheus offers to show him "how deep the rabbit hole goes" and reveal the truth about the Matrix.',
      'hj-refusal': 'When agents arrive at his office, Neo initially tries to escape but refuses to climb along the building ledge. He allows himself to be captured instead.',
      'hj-mentor': 'Morpheus becomes Neo\'s mentor, offering him the red pill/blue pill choice. He guides Neo to the truth about the Matrix and his potential as "The One."',
      'hj-threshold': 'Neo takes the red pill and is unplugged from the Matrix. He awakens in the real world for the first time, seeing the devastating truth of human enslavement.',
      'hj-tests': 'Neo trains in combat simulations, learns to bend Matrix rules, fails his first jump, meets the crew of the Nebuchadnezzar, and visits the Oracle.',
      'hj-approach': 'The team prepares to rescue Morpheus from Agent Smith. Neo and Trinity arm themselves heavily, knowing they\'re walking into a trap.',
      'hj-ordeal': 'Neo faces Agent Smith in the subway station. He\'s beaten badly and nearly killed, but chooses to stand and fight rather than run.',
      'hj-reward': 'Neo begins to believe in himself, moving faster than the agents. He rescues Morpheus and gains confidence in his abilities as The One.',
      'hj-road-back': 'The team races to get back to their exit point while being pursued by Agents. Cypher\'s betrayal has made their return more dangerous.',
      'hj-resurrection': 'Agent Smith kills Neo in the Matrix. Trinity\'s kiss and declaration of love resurrect him. Neo rises with full power, seeing the Matrix\'s code.',
      'hj-return': 'Neo defeats the Agents and returns as The One. He warns the Matrix of coming change and flies away, having mastered both worlds.'
    }
  },

  // Syd Field Paradigm Examples
  {
    id: 'chinatown-paradigm',
    title: 'Chinatown',
    framework: 'syd-field',
    beats: {
      'sf-setup': 'Private investigator Jake Gittes specializes in matrimonial work in 1937 Los Angeles. He\'s hired by "Mrs. Mulwray" to investigate her husband\'s affair.',
      'sf-inciting': 'Jake photographs Hollis Mulwray with a young woman, but the real Mrs. Mulwray appears, threatening to sue. Jake realizes he\'s been set up.',
      'sf-plot-point-1': 'Hollis Mulwray is found dead, apparently drowned. Jake, feeling responsible and his reputation damaged, commits to finding the truth.',
      'sf-confrontation': 'Jake uncovers a conspiracy involving water rights, the drought, and corruption. He faces threats, gets his nose slashed, and discovers Evelyn\'s dark secret.',
      'sf-midpoint': 'Jake discovers the girl is Evelyn\'s daughter AND her sister - the product of incest with her father, Noah Cross.',
      'sf-plot-point-2': 'Evelyn is shot by the police while trying to escape with her daughter. The corruption goes all the way to the top.',
      'sf-resolution': 'Noah Cross gets away with everything and gains custody of his daughter/granddaughter. Jake is told to "Forget it, Jake. It\'s Chinatown."'
    }
  },

  // Nutshell Technique Example
  {
    id: 'casablanca-nutshell',
    title: 'Casablanca',
    framework: 'nutshell',
    beats: {
      'ns-setup': 'Rick wants to remain neutral and uninvolved in the war, running his café and nursing his broken heart over Ilsa.',
      'ns-point-sync': 'Of all the gin joints in all the world, Ilsa walks into Rick\'s café with her husband, resistance leader Victor Laszlo.',
      'ns-flaw': 'Rick\'s flaw is his cynicism and self-centeredness, hiding his pain behind a facade of not caring about anyone or any cause.',
      'ns-crisis': 'Rick must decide whether to use the letters of transit to escape with Ilsa or give them to Laszlo to continue fighting the Nazis.',
      'ns-choice': 'Rick chooses to sacrifice his happiness with Ilsa for the greater good, putting aside his personal desires.',
      'ns-climax': 'At the airport, Rick puts Ilsa and Laszlo on the plane, shoots Major Strasser, and commits to the resistance.',
      'ns-catch': 'Rick wanted to avoid involvement and emotional pain, but by engaging with the situation, he finds redemption and purpose.',
      'ns-payoff': 'Rick walks off with Captain Renault to join the Free French. His cynicism is replaced by commitment to a cause greater than himself.'
    }
  }
]