'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/lib/auth/context';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const suggestedPrompts = [
  'What jobs do I have scheduled this week?',
  'Give me a daily brief',
  'Help me create an estimate for a switchboard upgrade',
  'Which customers need a follow-up?',
  'Suggest materials for a bathroom renovation',
];

export default function ChatPage() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getSimulatedResponse(content, profile),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          AI Assistant
        </h1>
        <p className="text-muted-foreground">
          Your AI-powered business copilot for job management, estimates, and insights
        </p>
      </div>

      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 p-0 flex flex-col">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                <div className="rounded-full bg-primary/10 p-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Welcome to TradePilot AI</h3>
                  <p className="text-muted-foreground mt-1">
                    I can help you with job management, estimates, customer insights, and more.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-w-md">
                  {suggestedPrompts.map((prompt) => (
                    <Button
                      key={prompt}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => sendMessage(prompt)}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-3',
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'rounded-lg px-4 py-2 max-w-[80%]',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    {message.role === 'user' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="rounded-lg bg-muted px-4 py-2">
                      <div className="flex gap-1">
                        <span className="animate-bounce">.</span>
                        <span className="animate-bounce delay-100">.</span>
                        <span className="animate-bounce delay-200">.</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <div className="border-t p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about your business..."
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Simulated responses - replace with actual AI integration
function getSimulatedResponse(input: string, profile: any): string {
  const lowerInput = input.toLowerCase();

  if (lowerInput.includes('daily brief') || lowerInput.includes('brief')) {
    return `Good morning, ${profile?.full_name?.split(' ')[0] || 'there'}!\n\nHere's your daily brief:\n\n📋 **Today's Schedule**\nYou have 2 jobs scheduled for today.\n\n💰 **Revenue Update**\nThis month: $8,450 from 12 completed jobs\n\n📞 **Follow-ups Needed**\n2 customers haven't been contacted in over 30 days.\n\n💡 **Tip of the Day**\nConsider sending a follow-up email to recent customers about maintenance services.`;
  }

  if (lowerInput.includes('schedule') || lowerInput.includes('this week')) {
    return `You have 5 jobs scheduled this week:\n\n• **Monday**: Kitchen Renovation - Electrical (John Smith)\n• **Tuesday**: Hot Water System Replacement (Sarah Johnson)\n• **Wednesday**: Switchboard Upgrade (Mike Davis)\n• **Thursday**: Power Point Installation (Emma Wilson)\n• **Friday**: Safety Inspection (Robert Brown)\n\nWould you like me to help optimize your route or provide more details on any of these jobs?`;
  }

  if (lowerInput.includes('estimate') || lowerInput.includes('quote')) {
    return `I can help you create an estimate. For a switchboard upgrade, here's a typical breakdown:\n\n**Labour:**\n• Installation: 4 hours @ $95/hr = $380\n• Testing & Commissioning: 1 hour @ $95/hr = $95\n\n**Materials:**\n• 63A switchboard = $450\n• Circuit breakers (10x) = $200\n• Cabling and sundries = $150\n\n**Subtotal**: $1,275\n**GST (10%)**: $127.50\n**Total**: $1,402.50\n\nWould you like me to adjust any of these figures or add this to a job?`;
  }

  if (lowerInput.includes('follow-up') || lowerInput.includes('customer')) {
    return `Here are customers who need follow-up:\n\n1. **Robert Wilson** - Last contacted 15 days ago\n   Phone: 0412 345 678\n\n2. **Emma Brown** - Follow-up was scheduled for 2 days ago\n   Email: emma@example.com\n\nWould you like me to mark any of these as contacted or schedule new follow-up dates?`;
  }

  if (lowerInput.includes('material') || lowerInput.includes('bathroom')) {
    return `For a bathroom renovation, here are commonly needed materials:\n\n**Plumbing:**\n• Mixer taps and fixtures\n• PVC/copper pipes\n• Drainage fittings\n\n**Electrical:**\n• Exhaust fan\n• LED downlights\n• Power points (water-rated)\n• Heat lamp\n\n**Finishing:**\n• Waterproofing membrane\n• Tiles and adhesive\n• Grout and sealant\n\nWould you like me to add these to your materials catalog with pricing?`;
  }

  return `I understand you're asking about "${input}". As your AI assistant, I can help with:\n\n• Job scheduling and management\n• Creating estimates and quotes\n• Customer follow-up reminders\n• Material suggestions and pricing\n• Business insights and analytics\n\nCould you provide more details about what you'd like help with?`;
}
