import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    });
  }

  async generateEmailContent(data: {
    name: string;
    type: 'checkin' | 'checkout';
    time: Date;
  }): Promise<{ subject: string; content: string }> {
    const prompt = `Generate a professional and friendly email for an employee's attendance ${
      data.type
    } notification. Use these details:
    - Employee Name: ${data.name}
    - Action: ${data.type}
    - Time: ${data.time.toLocaleString()}
    
    The email should:
    - Be warm and professional
    - Include the time of ${data.type}
    - Be concise (2-3 short paragraphs)
    - End with a positive note
    
    Format the response as JSON with 'subject' and 'content' fields.`;

    try {
      const completion = await this.openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content;
      console.log(response);

      if (!response) {
        throw new Error('No response from OpenAI');
      }

      try {
        return JSON.parse(response);
      } catch {
        // If OpenAI doesn't return valid JSON, extract content manually
        const subject = `Attendance ${data.type} Confirmation`;
        return { subject, content: response };
      }
    } catch (error) {
      console.error('OpenAI API Error:');

      if (error.code === 'insufficient_quota') {
        console.error('Quota exceeded. Check OpenAI billing details.');
      } else if (error.code === 'invalid_api_key') {
        console.error(
          'Invalid API key. Check OPENAI_API_KEY details in the .env file, here is message from OpenAI: ' +
            error.message,
        );
      }

      // TODO:Fallback to a template email if OpenAI API fails
      return {
        subject: `Attendance ${data.type} Confirmation`,
        content: `
          <p>Hello ${data.name},</p>
          <p>This is to confirm your ${data.type} at ${data.time.toLocaleString()}.</p>
          <p>Thank you for keeping your attendance!</p>
        `,
      };
    }
  }
}
