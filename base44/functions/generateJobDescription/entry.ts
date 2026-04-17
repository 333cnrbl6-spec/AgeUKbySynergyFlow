import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * Generates detailed job descriptions and suggests tags/categories using AI.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { job_title, required_skills, responsibilities } = await req.json();

    if (!job_title || !required_skills || !responsibilities) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const prompt = `You are an expert job description writer for a charity organization specializing in home support services. 
    
Generate a detailed, compelling job description based on these inputs:
- Job Title: ${job_title}
- Required Skills: ${required_skills}
- Key Responsibilities: ${responsibilities}

The job description should:
1. Start with an engaging overview of the role
2. Clearly outline key responsibilities
3. List required skills and qualifications
4. Mention benefits of working with Age UK Bury
5. Include information about the organization

Also suggest relevant tags and a job category for this position.

Return your response in the following JSON format:
{
  "title": "Job title",
  "description": "Full job description (3-4 paragraphs)",
  "key_responsibilities": ["responsibility 1", "responsibility 2", "responsibility 3"],
  "required_skills": ["skill 1", "skill 2", "skill 3"],
  "suggested_tags": ["tag1", "tag2", "tag3", "tag4"],
  "category": "category name"
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          key_responsibilities: { type: 'array', items: { type: 'string' } },
          required_skills: { type: 'array', items: { type: 'string' } },
          suggested_tags: { type: 'array', items: { type: 'string' } },
          category: { type: 'string' }
        },
        required: ['title', 'description', 'key_responsibilities', 'required_skills', 'suggested_tags', 'category']
      }
    });

    return Response.json({
      success: true,
      generated_content: result
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});