import { OpenAIStream, OpenAIStreamPayload } from "../../utils/OpenAIStream";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("Missing env var from OpenAI");
}

export const config = {
  runtime: "edge",
};

const handler = async (req: Request): Promise<Response> => {
  const { topic, proficiency } = (await req.json()) as {
    topic?: string;
    proficiency?: string;
  };

  if (!topic || !proficiency) {
    return new Response("No topic or proficiency level in the request", { status: 400 });
  }

  const prompt = `Generate a project idea for a ${proficiency} level student, the topic is ${topic}`;

  const payload: OpenAIStreamPayload = {
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    max_tokens: 200,
    stream: true,
    n: 1,
  };

  const stream = await OpenAIStream(payload);
  // return stream response (SSE)
  return new Response(
      stream, {
        headers: new Headers({
          'Cache-Control': 'no-cache',
        })
      }
  );
};

export default handler;
