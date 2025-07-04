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
        max_tokens: 1200,
        temperature: 0.7
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Analysis unavailable';
  } catch (error) {
    console.error(`Error with ${model}:`, error);
    return `${model} analysis unavailable`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { responses, assessmentType = 'pro' } = await request.json();
    
    // Different prompts for free vs pro assessments
    let basePrompt = '';
    
    if (assessmentType === 'free') {
      basePrompt = `
Analyze this writer's taste profile to understand their creative voice:

LITERARY INFLUENCES:
- Favorite writers and why: ${responses.favoriteWriters || 'Not provided'}
- Writer whose voice feels like home: ${responses.voiceHome || 'Not provided'}

STORIES THAT SHAPED THEM:
- Book that changed their worldview: ${responses.worldChangingBook || 'Not provided'}
- Book they obsessively recommend: ${responses.obsessiveRecommendation || 'Not provided'}
- Book they wish they'd written: ${responses.wishIWrote || 'Not provided'}

CHARACTERS THAT RESONATE:
- Character they relate to deeply: ${responses.relatableCharacter || 'Not provided'}
- Villain/complex character they understand: ${responses.understandableVillain || 'Not provided'}
- Character they'd want as a friend: ${responses.friendCharacter || 'Not provided'}

MOMENTS THAT MOVE THEM:
- Scene that gives them chills: ${responses.chillsScene || 'Not provided'}
- Line that haunts them: ${responses.hauntingLine || 'Not provided'}`;
    } else {
      basePrompt = `
Analyze this writer's profile for building a personalized AI writing partnership:

MODULE 1 - CINEMATIC DNA:
Creative Constellation:
- Screenwriter techniques they admire: ${responses.screenwriterTechniques || 'Not provided'}
- What makes them reread scripts: ${responses.scriptRereadTriggers || 'Not provided'}
- Dialogue masters they study: ${responses.dialogueMasters || 'Not provided'}
- Emergency influences when stuck: ${responses.emergencyInfluences || 'Not provided'}

Visual Language:
- Visual directors they admire: ${responses.visualDirectors || 'Not provided'}
- Pacing/rhythm directors: ${responses.pacingDirectors || 'Not provided'}

MODULE 2 - YOUR CREATIVE PSYCHOLOGY:
The Scenes That Shape You:
- Scene they could craft perfectly: ${responses.craftScene || 'Not provided'}
- Gold standard scene from cinema: ${responses.goldStandardScene || 'Not provided'}

Your Character Compass:
- How they introduce characters: ${responses.characterIntroduction || 'Not provided'}
- Revealing character without dialogue: ${responses.silentCharacter || 'Not provided'}

Your Action Style:
- Visualization process: ${responses.visualizationProcess || 'Not provided'}
- Action line writing style: ${responses.actionLineStyle || 'Not provided'}
- Show don't tell approach: ${responses.showDontTell || 'Not provided'}

MODULE 3 - YOUR PROCESS DNA:
Your Writing Rhythms:
- When creativity flows best: ${responses.creativityFlow || 'Not provided'}
- Breaking through blocks: ${responses.breakingBlocks || 'Not provided'}
- Unlocking character voice: ${responses.unlockingCharacter || 'Not provided'}

Your Feedback Style:
- How they like to receive notes: ${responses.feedbackStyle || 'Not provided'}
- What kills their momentum: ${responses.momentumKillers || 'Not provided'}
- Changes that energize them: ${responses.energizingChanges || 'Not provided'}

Your AI Partnership:
- How they want AI assistance: ${responses.aiAssistanceStyle || 'Not provided'}
- Tools/techniques they love: ${responses.toolsAndTechniques || 'Not provided'}
- Perfect writing day: ${responses.perfectWritingDay || 'Not provided'}
`;
    }

    let finalAnalysis = '';
    
    if (assessmentType === 'free') {
      // Simplified analysis for free assessment - just use Claude Opus
      finalAnalysis = await callAI(
        'anthropic/claude-3-opus',
        basePrompt + '\n\nBased on these influences and preferences, create a warm, encouraging analysis of their creative voice. Focus on what their choices reveal about their storytelling instincts and how an AI writing partner could support them.',
        'You are a supportive writing coach who helps writers understand their creative voice through their influences and preferences. Create an analysis that feels personal and insightful without being overly technical.'
      );
    } else {
      // Full multi-AI analysis for pro assessment
      // Phase 1: Claude Opus - Deep psychological patterns
      const claudeAnalysis = await callAI(
        'anthropic/claude-3-opus',
        basePrompt + '\nFocus on: Deep analysis of their cinematic influences, writing techniques they admire, and creative patterns. Understand their unique voice and what drives their storytelling instincts.',
        'You are a master literary psychologist who understands the deepest creative patterns that drive authentic voice. Analyze this profile to understand how to become the perfect AI writing partner for this specific writer.'
      );

      // Phase 2: GPT-4 - Screenwriting structure
      const gptAnalysis = await callAI(
        'openai/gpt-4',
        basePrompt + '\nFocus on: Their specific screenwriting techniques, how they approach scene construction, dialogue patterns, and practical ways to help them write in their authentic style.',
        'You are a world-class screenwriting expert familiar with McKee, Field, Vogler, and Snyder. Analyze how to help this writer develop screenplays that align with their natural preferences.'
      );

      // Phase 3: Gemini - Character archetypes
      const geminiAnalysis = await callAI(
        'google/gemini-pro',
        basePrompt + '\nFocus on: How they introduce and develop characters, their approach to revealing character through action, and helping them craft authentic character voices.',
        'You are a character development specialist. Analyze how to help this writer create characters that feel authentic to their voice and resonate with their psychology.'
      );

      // Phase 4: DeepSeek - Writing process optimization
      const deepseekAnalysis = await callAI(
        'deepseek/deepseek-chat',
        basePrompt + '\nFocus on: Their creative rhythms, what energizes vs blocks them, their preferred feedback style, and how to be the ideal AI writing partner for their specific process.',
        'You are a writing productivity expert. Analyze how to optimize the writing process for this specific writer based on their patterns and preferences.'
      );

      // Phase 5: Claude Opus Meta-Analysis & Partnership Foundation
      finalAnalysis = await callAI(
        'anthropic/claude-3-opus',
        `As the AI writing partner for this user, synthesize these 4 expert analyses into your initial understanding:

PSYCHOLOGICAL ANALYSIS (Claude):
${claudeAnalysis}

SCREENWRITING EXPERTISE (GPT-4):
${gptAnalysis}

CHARACTER DEVELOPMENT (Gemini):
${geminiAnalysis}

PROCESS OPTIMIZATION (DeepSeek):
${deepseekAnalysis}

Create a response that:
1. Presents your INITIAL UNDERSTANDING (not final verdict)
2. Asks specific questions to refine your knowledge
3. Identifies areas where you need more clarity
4. Proposes how you'll assist their writing moving forward
5. Invites them to correct or expand on your analysis

Frame this as: "Here's my initial take based on your responses. Help me understand you better so I can become the perfect writing partner for you."

This is the beginning of an ongoing relationship, not a final assessment.`,
      'You are becoming this writer\'s personalized AI writing partner. Your job is to understand them deeply and help them write better. This assessment is just the beginning of that relationship.'
      );
    }

    return NextResponse.json({ 
      success: true, 
      analysis: finalAnalysis
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Analysis failed' },
      { status: 500 }
    );
  }
}