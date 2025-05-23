import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AlertTriangle, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const YouTubeCommentPicker: React.FC = () => {
  const [apiKey, setApiKey] = useState("");
  const [videoId, setVideoId] = useState("");
  const [commentersText, setCommentersText] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isPicking, setIsPicking] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });
  const [rollingName, setRollingName] = useState(""
  );
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const showDialog = (message: string) => setDialog({ open: true, message });
  const closeDialog = () => setDialog({ open: false, message: "" });

  const fetchAllComments = async (
    vId: string,
    key: string,
    pageToken?: string,
    acc: Set<string> = new Set()
  ): Promise<Set<string>> => {
    const url = new URL("https://www.googleapis.com/youtube/v3/commentThreads");
    url.search = new URLSearchParams({
      part: "snippet",
      videoId: vId,
      key,
      maxResults: "100",
      textFormat: "plainText",
      ...(pageToken ? { pageToken } : {}),
    }).toString();

    const res = await fetch(url.toString());
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || res.statusText);
    }
    const data = await res.json();
    (data.items || []).forEach((i: any) => {
      const name = i?.snippet?.topLevelComment?.snippet?.authorDisplayName?.trim();
      if (name) acc.add(name);
    });
    if (data.nextPageToken) {
      return fetchAllComments(vId, key, data.nextPageToken, acc);
    }
    return acc;
  };

  const handleFetchComments = async () => {
    if (!apiKey) {
      showDialog("Please provide your YouTube API key");
      return;
    }
    if (!videoId) {
      showDialog("Please provide a YouTube video ID");
      return;
    }
    setIsFetching(true);
    setCommentersText("");
    setWinner(null);
    try {
      const commenters = await fetchAllComments(videoId.trim(), apiKey.trim());
      if (commenters.size === 0) {
        showDialog("No comments found");
      } else {
        setCommentersText(Array.from(commenters).join("\n"));
        showDialog(`Fetched ${commenters.size} unique commenters`);
      }
    } catch (e: any) {
      showDialog(`Failed to fetch comments: ${e.message}`);
    } finally {
      setIsFetching(false);
    }
  };

  const handlePickWinner = () => {
    const names = commentersText.split("\n").map((n) => n.trim()).filter(Boolean);
    if (names.length === 0) {
      showDialog("Please fetch or enter at least one commenter");
      return;
    }
    setIsPicking(true);
    setWinner(null);
    let ticks = 0;
    intervalRef.current = setInterval(() => {
      setRollingName(names[Math.floor(Math.random() * names.length)]);
      ticks += 1;
      if (ticks > 40) {
        clearInterval(intervalRef.current);
        setWinner(names[Math.floor(Math.random() * names.length)]);
        setIsPicking(false);
      }
    }, 80);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#1F262C] p-4 selection:bg-[#D85D3C] selection:text-white text-[#FAFAFA] font-sans">
        <Card className="w-full max-w-2xl bg-slate-800 shadow-2xl">
          <CardContent className="p-8 space-y-10">
            <header className="text-center space-y-1">
              <h1 className="text-5xl font-bold text-white">BK Cards</h1>
              <p className="text-xl text-white/90">Comment Picker</p>
              <p className="text-sm text-slate-300">Home of the Top Hit Giveaway!</p>
            </header>

            <section className="space-y-4 bg-slate-700 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-white">1. Fetch Comments via YouTube API</h2>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="YouTube Data API Key"
                className="bg-slate-600 placeholder-slate-300 text-white"
              />
              <Input
                value={videoId}
                onChange={(e) => setVideoId(e.target.value)}
                placeholder="YouTube Video ID"
                className="bg-slate-600 placeholder-slate-300 text-white"
              />
              <Button
                onClick={handleFetchComments}
                disabled={isFetching}
                className="w-full bg-[#D85D3C] hover:bg-[#C05030] text-white font-bold tracking-wide shadow-lg ring-2 ring-white/80"
              >
                {isFetching && <Loader2 size={18} className="animate-spin mr-2" />}
                {isFetching ? "Fetching…" : "Fetch Comments"}
              </Button>
            </section>

            <section className="space-y-3 bg-slate-700 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-white">2. Enter or Review Commenters</h2>
              <Textarea
                rows={8}
                value={commentersText}
                onChange={(e) => setCommentersText(e.target.value)}
                placeholder="Commenter names"
                className="bg-slate-600 placeholder-slate-300 text-white resize-none"
              />
            </section>

            <section className="space-y-3 bg-slate-700 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-white">3. Pick a Winner</h2>
              <Button
                onClick={handlePickWinner}
                disabled={isPicking}
                className="w-full bg-[#D85D3C] hover:bg-[#C05030] text-white text-lg font-bold py-6 shadow-lg ring-2 ring-white/80"
              >
                {isPicking ? "Picking…" : "Pick a Winner!"}
              </Button>
            </section>

            <div className="min-h-[110px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                {isPicking && (
                  <motion.div
                    key="rolling"
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    className="p-6 bg-[#D85D3C] rounded-lg shadow-lg text-center"
                  >
                    <p className="text-sm text-white mb-2">Picking a winner…</p>
                    <p className="text-5xl sm:text-6xl font-extrabold text-white break-all animate-pulse">
                      {rollingName}
                    </p>
                  </motion.div>
                )}
                {winner && !isPicking && (
                  <motion.div
                    key="winner"
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    className="p-6 bg-[#D85D3C] rounded-lg shadow-lg text-center"
                  >
                    <p className="text-sm text-white mb-1">And the winner is…</p>
                    <p className="text-5xl sm:text-6xl font-extrabold text-white break-all">{winner}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="pt-6">
              <Button
                onClick={() => {
                  setCommentersText("");
                  setWinner(null);
                }}
                className="w-full bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold shadow ring-2 ring-slate-400"
              >
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialog.open} onOpenChange={closeDialog}>
        <DialogContent className="bg-slate-700 border border-[#D85D3C]/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <AlertTriangle className="text-[#D85D3C]" size={18} /> Notice
            </DialogTitle>
            <DialogDescription className="text-slate-300 text-sm">{dialog.message}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="bg-[#D85D3C] hover:bg-[#C05030] text-white" onClick={closeDialog}>
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default YouTubeCommentPicker;
