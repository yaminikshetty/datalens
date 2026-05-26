import { useState, useRef, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useListOpenaiConversations, useCreateOpenaiConversation, useGetOpenaiConversation, useDeleteOpenaiConversation, getGetOpenaiConversationQueryKey, getListOpenaiMessagesQueryKey, getListOpenaiConversationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Plus, Trash2, Send, Database, User, Bot, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AiAssistantPage() {
  const queryClient = useQueryClient();
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: convsLoading } = useListOpenaiConversations({ query: { queryKey: ["conversations"] } });
  
  const { data: activeConversation, isLoading: activeLoading } = useGetOpenaiConversation(
    activeConvId!, 
    { query: { enabled: !!activeConvId, queryKey: getGetOpenaiConversationQueryKey(activeConvId!) } }
  );

  const createConv = useCreateOpenaiConversation();
  const deleteConv = useDeleteOpenaiConversation();

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages, streamedResponse]);

  // Set initial active conversation
  useEffect(() => {
    if (conversations?.length && !activeConvId) {
      setActiveConvId(conversations[0].id);
    }
  }, [conversations, activeConvId]);

  const handleNewConversation = () => {
    createConv.mutate({ data: { title: "New Conversation" } }, {
      onSuccess: (data) => {
        setActiveConvId(data.id);
        queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
      },
      onError: () => toast.error("Failed to start new conversation")
    });
  };

  const handleDeleteConversation = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConv.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOpenaiConversationsQueryKey() });
        if (activeConvId === id) {
          setActiveConvId(conversations?.find(c => c.id !== id)?.id || null);
        }
        toast.success("Conversation deleted");
      },
      onError: () => toast.error("Failed to delete conversation")
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeConvId || isStreaming) return;

    const messageContent = inputMessage;
    setInputMessage("");
    setIsStreaming(true);
    setStreamedResponse("");

    // Optimistically add user message to cache so it shows up immediately
    queryClient.setQueryData(getGetOpenaiConversationQueryKey(activeConvId), (old: any) => {
      if (!old) return old;
      return {
        ...old,
        messages: [
          ...old.messages,
          { id: Date.now(), role: "user", content: messageContent, createdAt: new Date().toISOString() }
        ]
      };
    });

    try {
      const res = await fetch(`/api/openai/conversations/${activeConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageContent })
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter(line => line.trim().startsWith("data: "));
          
          for (const line of lines) {
            const dataStr = line.replace("data: ", "").trim();
            if (dataStr === "[DONE]") {
              done = true;
              break;
            }
            try {
              const data = JSON.parse(dataStr);
              if (data.done) {
                done = true;
              } else if (data.content) {
                setStreamedResponse(prev => prev + data.content);
              }
            } catch (err) {
              console.error("Error parsing SSE chunk", err);
            }
          }
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);
      toast.error("AI service is currently unavailable. Please try again later.");
      setStreamedResponse("⚠️ Failed to connect to AI Assistant.");
    } finally {
      setIsStreaming(false);
      queryClient.invalidateQueries({ queryKey: getGetOpenaiConversationQueryKey(activeConvId) });
      queryClient.invalidateQueries({ queryKey: getListOpenaiMessagesQueryKey(activeConvId) });
    }
  };

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-120px)] border border-border rounded-xl overflow-hidden bg-card shadow-2xl">
        
        {/* Sidebar */}
        <div className="w-80 border-r border-border bg-muted/20 flex flex-col hidden md:flex">
          <div className="p-4 border-b border-border">
            <Button onClick={handleNewConversation} className="w-full justify-start font-medium" variant="outline" disabled={createConv.isPending}>
              <Plus className="mr-2 h-4 w-4" />
              New Query
            </Button>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {convsLoading ? (
                <div className="space-y-2 p-2">
                  <Skeleton className="h-10 w-full rounded" />
                  <Skeleton className="h-10 w-full rounded" />
                </div>
              ) : conversations?.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`w-full flex items-center justify-between text-left px-3 py-2.5 rounded-md text-sm transition-colors group
                    ${activeConvId === conv.id ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-muted'}
                  `}
                >
                  <div className="flex items-center truncate mr-2">
                    <MessageSquare className="h-4 w-4 mr-2 shrink-0 opacity-70" />
                    <span className="truncate">{conv.title}</span>
                  </div>
                  <div 
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 hover:text-destructive p-1 rounded-sm hover:bg-destructive/10 transition-all shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </div>
                </button>
              ))}
              {conversations?.length === 0 && !convsLoading && (
                <p className="text-xs text-muted-foreground text-center py-6">No conversation history.</p>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-background">
          {activeConvId ? (
            <>
              {/* Header */}
              <div className="h-14 border-b border-border flex items-center px-6 bg-card/50">
                <Database className="h-4 w-4 text-primary mr-2" />
                <h2 className="font-medium text-foreground truncate">
                  {activeConversation?.title || "Data Assistant"}
                </h2>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6 max-w-3xl mx-auto pb-4">
                  {activeConversation?.messages.map((msg, idx) => (
                    <div key={msg.id || idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role !== 'user' && (
                        <div className="h-8 w-8 rounded-md bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30 text-primary">
                          <Bot className="h-5 w-5" />
                        </div>
                      )}
                      
                      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm
                        ${msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                          : 'bg-muted text-foreground border border-border rounded-tl-sm'
                        }
                      `}>
                        {msg.content}
                      </div>
                    </div>
                  ))}

                  {/* Streaming response */}
                  {isStreaming && (
                    <div className="flex gap-4 justify-start">
                      <div className="h-8 w-8 rounded-md bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30 text-primary">
                        <Bot className="h-5 w-5" />
                      </div>
                      <div className="max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-3 text-sm bg-muted text-foreground border border-border">
                        {streamedResponse || (
                          <div className="flex items-center space-x-1 h-5">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t border-border bg-card">
                <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto relative flex items-center">
                  <Input 
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask about your metrics, trends, or system health..."
                    className="pr-12 h-12 bg-background border-border shadow-sm rounded-xl focus-visible:ring-primary"
                    disabled={isStreaming}
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    className="absolute right-1.5 h-9 w-9 rounded-lg transition-transform hover:scale-105"
                    disabled={!inputMessage.trim() || isStreaming}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
                <div className="text-center mt-2">
                  <span className="text-[10px] text-muted-foreground flex justify-center items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    AI Assistant can query your database metrics. Responses are generated.
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
              <Database className="h-16 w-16 mb-4 text-muted-foreground/30" />
              <h3 className="text-xl font-medium text-foreground mb-2">AI Data Assistant</h3>
              <p className="text-center max-w-md mb-6">
                Ask questions about your metrics in plain English. Generate SQL insights without writing a single line of code.
              </p>
              <Button onClick={handleNewConversation} size="lg">Start a Query</Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}