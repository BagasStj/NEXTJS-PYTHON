import { NextResponse } from 'next/server';
import { ChatOpenAI } from "@langchain/openai";
import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import { ChatPromptTemplate, HumanMessagePromptTemplate, SystemMessagePromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";

const memory = new BufferMemory({
    returnMessages: true,
    memoryKey: "history",
});

export async function POST(request: Request) {
    const { messages, model, temperature, topP, presencePenalty, frequencyPenalty, maxTokens, prompt } = await request.json();

    const chatModel = new ChatOpenAI({
        modelName: model,
        temperature,
        topP,
        presencePenalty,
        frequencyPenalty,
        maxTokens,
        openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const chatPrompt = ChatPromptTemplate.fromPromptMessages([
        SystemMessagePromptTemplate.fromTemplate(prompt || "You are a helpful AI assistant."),
        new MessagesPlaceholder("history"),
        HumanMessagePromptTemplate.fromTemplate("{input}")
    ]);

    const chain = new ConversationChain({
        llm: chatModel,
        memory: memory,
        prompt: chatPrompt,
    });

    try {
        const response = await chain.call({ input: messages });
        return NextResponse.json({ response: response.response });
    } catch (error) {
        console.error('Error in chat processing:', error);
        return NextResponse.json({ error: 'An error occurred during processing' }, { status: 500 });
    }
}