import { NextRequest, NextResponse } from 'next/server'

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
        max_tokens: 1500,
        temperature: 0.7
      })
    })

    const data = await response.json()
    return data.choices?.[0]?.message?.content || 'Refinement unavailable'
  } catch (error) {
    console.error(`Error with ${model}:`, error)
    return `${model} refinement unavailable`
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const refinementPrompt = `
ORIGINAL AI ANALYSIS:
${data.originalAnalysis}

WRITER'S FEEDBACK:
- What felt accurate: ${data.refinementResponses?.accurate || 'Not provided'}
- What needs correction: ${data.refinementResponses?.corrections || 'Not provided'}
- Additional context: ${data.refinementResponses?.additional || 'Not provided'}
- How they want assistance: ${data.refinementResponses?.assistance || 'Not provided'}

Based on this feedback, update your understanding and create a refined analysis that:
1. Acknowledges what you got right
2. Corrects your understanding based on their feedback
3. Incorporates the additional context they provided
4. Adjusts your approach based on how they want assistance
5. Creates a concrete plan for your ongoing writing partnership

This is now your REFINED understanding of this writer and how you'll work together.`

    const refinedAnalysis = await callAI(
      'anthropic/claude-3-opus',
      refinementPrompt,
      'You are this writer\'s AI partner, updating your understanding based on their direct feedback. Create a refined analysis that shows you\'ve listened to their corrections, demonstrates deeper understanding, outlines your concrete approach as their writing partner, and sets expectations for ongoing collaboration.'
    )

    return NextResponse.json({ 
      success: true, 
      analysis: refinedAnalysis
    })

  } catch (error) {
    console.error('Refinement error:', error)
    return NextResponse.json(
      { success: false, error: 'Refinement failed' },
      { status: 500 }
    )
  }
}