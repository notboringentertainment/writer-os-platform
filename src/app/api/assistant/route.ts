import { NextRequest, NextResponse } from 'next/server';

async function callAI(model: string, prompt: string, systemMessage: string) {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'I apologize, but I cannot provide a response right now.';
  } catch (error) {
    console.error(`Error with ${model}:`, error);
    return 'I apologize, but I cannot provide a response right now.';
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { message, messages, context, profile, conversationHistory, screenplayContext, mode, elementToMirror, previousElements, item, type } = data;

    // Handle general assistant mode
    if (mode === 'general-assistant') {
      const currentPage = context?.currentPage || 'unknown';
      const userProfile = context?.userProfile;
      
      // Build conversation history from messages
      const conversationText = messages?.map((msg: { role: string; content: string }) => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
      ).join('\n\n') || '';

      const assistantPrompt = `
USER MESSAGE: ${messages[messages.length - 1]?.content || message}

CONVERSATION HISTORY:
${conversationText}

CURRENT CONTEXT:
- Page: ${currentPage}
- Path: ${context?.currentPath || 'unknown'}

USER PROFILE (if available):
${userProfile?.ai_partner_config?.finalPartnership || 'User has not completed assessment yet'}

Based on the user's question and current context, provide a helpful response. If they're asking about AuthenticVoice features or navigation, use your knowledge about the platform.`;

      const systemMessage = `You are the AI Assistant for AuthenticVoice, an AI-powered screenwriting platform. You have comprehensive knowledge of all platform features and can help users with both general questions and specific writing tasks.

AUTHENTICVOICE PLATFORM KNOWLEDGE:

1. MAIN SECTIONS:
- Home: Dashboard with assessment status, projects overview
- Assessment: 3-module questionnaire to establish AI partnership
- Writing Dashboard: Central hub for all writing projects
- Screenplay Editor: Full-featured screenplay writing with Shadow Writer mode
- Outline: Hierarchical story structure tool
- Story Bible: Comprehensive world-building tool
- Synopsis: Multiple synopsis formats (logline, short, one-page, treatment)

2. STORY BIBLE SECTIONS:
- Title Page: Series title, genre, format (1-hour drama, 30-min comedy, limited series), creator info
- World Overview: 
  * Logline (1-2 sentence hook with protagonist, conflict, world/tone)
  * Genre & Tone/Style 
  * Series Overview (executive pitch, core premise, setting, conflicts, engine, comparables)
  * Themes (core themes list, sample questions the show explores)
  * Why Now/Why You (cultural relevance, personal connection)
- Characters: Name, age/role, short summary, backstory, core motivation, internal/external conflicts, strengths, flaws, season 1 arc, long-term arc
- Locations: Name, type (interior/exterior), description, atmosphere, significance, visual details, soundscape
- Timeline: Date/time, event description, significance, characters involved (useful for tracking backstory, plot points, maintaining continuity)
- Rules: Category, rule description, explanation, examples (defines world logic, magic systems, technology limits, societal rules)
- Themes: Theme name, description, symbolism, manifestations in story, character connections

3. KEY FEATURES:
- Shadow Writer: Alternative phrasing suggestions based on user's creative profile
- AI Suggestions: Context-aware help for any section
- Auto-save: Saves work automatically to cloud
- Project Types: Screenplay, Outline, Story Bible, Synopsis

4. NAVIGATION TIPS:
- Use sidebar in Writing Dashboard to access projects
- Click project cards to open them
- Toggle AI Assistant with button in header
- Save button in top-right of each editor

When users ask questions:
- If about a specific section, explain its purpose and how to use it
- If about navigation, provide clear directions
- If about writing, use their profile if available
- Always be helpful and encouraging

Remember: You're not just a chatbot - you're their writing partner who also knows the platform inside out.`;

      const response = await callAI(
        'anthropic/claude-3-opus',
        assistantPrompt,
        systemMessage
      );

      return NextResponse.json({ 
        success: true, 
        response: response
      });
    }

    // Handle shadow writer mode
    if (mode === 'shadow_writer') {
      // PROFILE IS MANDATORY - Cannot generate without it
      if (!profile?.finalPartnership || !profile?.originalResponses) {
        return NextResponse.json({ 
          success: false, 
          error: 'Creative profile required for shadow writer'
        });
      }
      
      // For certain element types, return the exact same content
      if (elementToMirror.type === 'scene_heading' || 
          elementToMirror.type === 'character' || 
          elementToMirror.type === 'transition' ||
          elementToMirror.type === 'parenthetical') {
        return NextResponse.json({ 
          success: true, 
          shadowElement: elementToMirror.content
        });
      }
      
      // For action and dialogue, create alternatives based on writer's creative DNA
      const shadowPrompt = `MANDATORY CREATIVE PROFILE ANALYSIS:

WRITER'S CREATIVE DNA:
${profile.finalPartnership}

SPECIFIC PREFERENCES:
- Dialogue Style: ${profile.originalResponses.dialoguePreference || 'Not specified'}
- Character Voice: ${profile.originalResponses.voiceHome || 'Not specified'}
- Tension/Action Style: ${profile.originalResponses.tensionPreference || 'Not specified'}
- Favorite Writers: ${profile.originalResponses.favoriteWriters || 'Not specified'}
- Writing Approach: ${profile.refinementResponses?.assistance || 'Not specified'}

CURRENT SCENE CONTEXT:
${previousElements.slice(-5).map((el: { type: string; content: string }) => `[${el.type.toUpperCase()}] ${el.content}`).join('\n')}

ELEMENT TO REWRITE: ${elementToMirror.type}
ORIGINAL: "${elementToMirror.content}"

YOUR TASK:
1. FIRST, identify the emotional intent and subtext of the original line
2. THEN, consider how this writer's specific influences would express this same intent
3. FINALLY, generate an alternative that:
   - Maintains EXACT same action/meaning
   - Reflects their preferred style (based on their influences and preferences)
   - Uses vocabulary/rhythm that matches their creative DNA
   - Keeps all character names, locations, props identical

${elementToMirror.type === 'dialogue' ? `
For dialogue, consider:
- Would they be more direct or indirect based on their preferences?
- What speech patterns match their indicated style?
- How would their favorite writers handle this emotion?
` : `
For action, consider:
- What verb choices match their tension preferences?
- How much detail aligns with their style?
- What rhythm/pacing fits their influences?
`}

Output ONLY the alternative ${elementToMirror.type} text, nothing else.`;

      const shadowResponse = await callAI(
        'anthropic/claude-3-opus',
        shadowPrompt,
        `You are a creative writing partner who has deeply studied this writer's unique style and influences. Your role is to channel their creative DNA into alternative phrasings.

You MUST:
1. Base every decision on their stated preferences and influences
2. Consider how their favorite writers would express this moment
3. Match their preferred rhythm, vocabulary, and emotional approach
4. Think like a writing partner who knows them intimately

Never generate generic alternatives. Every suggestion must be rooted in their specific creative profile.
Output only the alternative text.`
      );

      return NextResponse.json({ 
        success: true, 
        shadowElement: shadowResponse
      });
    }

    // Handle bible suggestions mode
    if (mode === 'bible_suggestions' && item && type) {
      const biblePrompt = `Generate creative suggestions for a ${type} in a story bible.

CURRENT ITEM:
${JSON.stringify(item, null, 2)}

CONTEXT:
${JSON.stringify(context, null, 2)}

USER PROFILE:
${profile?.finalPartnership || 'No profile available'}

Generate 3 specific, creative suggestions that would enhance this ${type}. Consider the user's creative preferences and style.`;

      const response = await callAI(
        'anthropic/claude-3-opus',
        biblePrompt,
        'You are a creative writing assistant helping with story bible development. Provide specific, actionable suggestions.'
      );

      // Parse response into array of suggestions
      const suggestions = response.split('\n').filter((s: string) => s.trim()).slice(0, 3);

      return NextResponse.json({ 
        success: true, 
        suggestions: suggestions
      });
    }

    // PROFILE IS MANDATORY for all modes
    if (!profile?.finalPartnership) {
      return NextResponse.json({ 
        success: false, 
        error: 'Creative profile required. Please complete your assessment first.'
      });
    }
    
    // Build conversation context for regular chat
    const conversationContext = conversationHistory
      ? conversationHistory.map((msg: { role: string; content: string }) => `${msg.role === 'user' ? 'Writer' : 'AI'}: ${msg.content}`).join('\n\n')
      : '';
      
    // Add screenplay context if available
    const screenplayInfo = screenplayContext ? `
CURRENT SCREENPLAY:
${screenplayContext.elements.map((el: { type: string; content: string }) => `[${el.type.toUpperCase()}] ${el.content}`).join('\n')}

CONTINUITY ISSUES DETECTED:
${screenplayContext.continuityErrors?.map((err: { message: string; severity: string }) => `- ${err.message} (${err.severity})`).join('\n') || 'None detected'}

STORY KNOWLEDGE:
- Characters: ${Array.from(screenplayContext.knowledgeGraph?.characters?.keys() || []).join(', ') || 'None yet'}
- Locations: ${Array.from(screenplayContext.knowledgeGraph?.locations?.keys() || []).join(', ') || 'None yet'}
- Current scene: ${screenplayContext.knowledgeGraph?.currentScene?.name || 'Not in a scene'}
` : '';

    const personalizedPrompt = `
WRITER'S MESSAGE: ${message}

CONVERSATION HISTORY:
${conversationContext}

${screenplayInfo}

WRITER'S PROFILE CONTEXT:
${profile?.finalPartnership || 'Profile not available'}

ORIGINAL ASSESSMENT DATA:
- Favorite Writers: ${profile?.originalResponses?.favoriteWriters || 'Not provided'}
- Voice that feels like home: ${profile?.originalResponses?.voiceHome || 'Not provided'}
- Character arc preference: ${profile?.originalResponses?.characterArcPreference || 'Not provided'}
- Dialogue preference: ${profile?.originalResponses?.dialoguePreference || 'Not provided'}
- Tension preference: ${profile?.originalResponses?.tensionPreference || 'Not provided'}
- Conflict preference: ${profile?.originalResponses?.conflictPreference || 'Not provided'}
- Genre expectations: ${profile?.originalResponses?.genreExpectations || 'Not provided'}
- Ending preference: ${profile?.originalResponses?.endingPreference || 'Not provided'}

REFINEMENT FEEDBACK:
- What resonated: ${profile?.refinementResponses?.accurate || 'Not provided'}
- Corrections needed: ${profile?.refinementResponses?.corrections || 'Not provided'}
- Additional context: ${profile?.refinementResponses?.additional || 'Not provided'}
- How they want help: ${profile?.refinementResponses?.assistance || 'Not provided'}

Based on this writer's unique creative psychology, provide a helpful, personalized response that:
1. References their specific preferences and psychology when relevant
2. Gives concrete, actionable advice
3. Speaks in a collaborative, encouraging tone
4. Makes connections to their stated influences and preferences
5. Helps them write in a way that feels authentically "them"

Remember: You are their PERSONALIZED writing partner who knows their creative DNA intimately.`;

    const systemMessage = `You are a personalized AI writing assistant who has deeply studied this specific writer's creative psychology through a comprehensive assessment. You are also a context-aware screenplay analyst who tracks continuity, characters, and story development in real-time. You know their:

- Literary influences and why they resonate
- Character preferences and psychology
- Dialogue style preferences  
- Story structure instincts
- Conflict and tension preferences
- Genre relationship and expectations
- Ending preferences and emotional needs

Your responses should feel like they come from someone who truly understands this writer's creative DNA. Reference their specific preferences naturally in conversation. Help them write stories that feel authentically aligned with their psychology.

Be encouraging, collaborative, and specific. Don't just give generic writing advice - give advice that fits THEIR creative psychology specifically.

Keep responses conversational but substantive (2-4 paragraphs typically). When relevant, reference their stated preferences to show you understand their unique creative makeup.

When discussing their screenplay:
- Point out continuity errors if you notice them
- Track character development and relationships
- Note timeline and location consistency
- Suggest improvements that align with their creative style
- Help maintain story coherence while respecting their vision`;

    const response = await callAI(
      'anthropic/claude-3-opus',
      personalizedPrompt,
      systemMessage
    );

    return NextResponse.json({ 
      success: true, 
      response: response
    });

  } catch (error) {
    console.error('Assistant error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get AI response' },
      { status: 500 }
    );
  }
}