import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { CheckCircle, Share2, Home } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

function Completion() {
  const [, params] = useRoute("/completion/:accessId");
  const [location] = useLocation();
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);

  // Extract video name from URL search params
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const videoName = urlParams.get('videoName') || 'this training module';
  const accessId = params?.accessId;

  const handleShare = async () => {
    setIsSharing(true);
    
    const shareData = {
      title: 'Training Completion Certificate',
      text: `I have successfully completed "${videoName}" on TaskSafe Training Platform!`,
      url: window.location.origin + `/completion/${accessId}?videoName=${encodeURIComponent(videoName)}`
    };

    try {
      // Check if Web Share API is available (mobile devices)
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(
          `${shareData.text}\n\nView certificate: ${shareData.url}`
        );
        toast({
          title: "Link copied!",
          description: "The completion certificate link has been copied to your clipboard."
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        // Fallback: Manual copy
        try {
          await navigator.clipboard.writeText(
            `I have successfully completed "${videoName}" on TaskSafe Training Platform!\n\nView certificate: ${shareData.url}`
          );
          toast({
            title: "Link copied!",
            description: "The completion certificate link has been copied to your clipboard."
          });
        } catch (clipboardError) {
          toast({
            variant: "destructive",
            title: "Sharing failed",
            description: "Unable to share or copy the link. Please try again."
          });
        }
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-green-950 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto text-center shadow-xl">
        <CardContent className="p-8 space-y-6">
          {/* Green Check Icon */}
          <div className="flex justify-center">
            <div className="bg-green-100 dark:bg-green-900 rounded-full p-4">
              <CheckCircle className="w-16 h-16 text-green-600 dark:text-green-400" />
            </div>
          </div>

          {/* Congratulations Message */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Congratulations!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              You have successfully completed{" "}
              <span className="font-semibold text-green-600 dark:text-green-400">
                "{videoName}"
              </span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <Button
              onClick={handleShare}
              disabled={isSharing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="button-share"
            >
              <Share2 className="w-4 h-4 mr-2" />
              {isSharing ? "Sharing..." : "Share Achievement"}
            </Button>
            
            <Button
              onClick={handleBackToHome}
              variant="outline"
              className="w-full"
              data-testid="button-home"
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>

          {/* Certificate Note */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
            This completion certificate can be shared to verify your training progress.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default Completion;