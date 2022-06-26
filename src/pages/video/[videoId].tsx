import type { NextPage } from "next";
import {
  Box,
  Button,
  CircularProgress,
  Heading,
  HStack,
  Text,
} from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import {
  chunk,
  ClassBlock,
  formatTime,
  getSpans,
  getSponsoredPhrases,
  getText,
  getTranscript,
  hms,
  matchPhrasesToTimestamps,
  Span,
  SponsorInfo,
} from "lib/api";
import { ArrowLeft } from "react-feather";
import NextLink from "next/link";
import { useRouter } from "next/router";
import YouTube from "react-youtube";
import Transcript from "components/Transcript";
import Header from "components/Header";

const VideoIdLoad: NextPage = () => {
  const router = useRouter();

  const [text, setText] = useState<string | null>("Loading Transcript");
  const [error, setError] = useState<string | null>(null);
  const [spans, setSpans] = useState<Span[] | null>(null);
  const [words, setWords] = useState<SponsorInfo[] | null>(null);

  const videoId = router.query.videoId as string;

  useEffect(() => {
    if (router.isReady) {
      (async () => {
        try {
          const transcript = await getTranscript(videoId as string);
          setText("Locating sponsors");
          const fetchedPhrases = await getSponsoredPhrases(getText(transcript));
          setText(null);
          const words = matchPhrasesToTimestamps(fetchedPhrases, transcript);
          if (!words) {
            setError("Could not find any phrases");
          } else {
            setWords(words);
            const spans = getSpans(words);
            setSpans(spans);
          }
        } catch (e) {
          setError(
            "Error occured. Please try again, or with a different video."
          );
          throw e;
        }
      })();
    }
  }, [router.isReady]);

  const videoRef = useRef<any | null>(null);
  const [playProgress, setPlayProgress] = useState(0);

  const timeChanged = (time: number) => {
    setPlayProgress(time);
    if (spans) {
      for (const span of spans) {
        const millis = time * 1000;
        if (span.isSponsor && span.start <= millis && span.end > millis) {
          videoRef.current.seekTo(span.end / 1000);
          break;
        }
      }
    }
  };

  return (
    <Box p="24" pt="14">
      <Header />
      {router.isReady && (
        <YouTube
          className="videoClass"
          videoId={videoId}
          onReady={(e) => {
            videoRef.current = e.target;
            var iframeWindow = videoRef.current.getIframe().contentWindow;

            var lastTimeUpdate = 0;

            window.addEventListener("message", function (event) {
              if (event.source === iframeWindow) {
                var data = JSON.parse(event.data);
                if (
                  data.event === "infoDelivery" &&
                  data.info &&
                  data.info.currentTime
                ) {
                  var time = data.info.currentTime;

                  if (time !== lastTimeUpdate) {
                    lastTimeUpdate = time;
                    timeChanged(time);
                  }
                }
              }
            });
          }}
        />
      )}
      <Text mt="2">
        Time: <b>{formatTime(playProgress)}</b>
      </Text>
      <Text fontSize="3xl" fontWeight="bold" mt="5">
        Transcript
      </Text>
      <Box
        maxHeight="96"
        overflow="scroll"
        width="50%"
        minWidth="750px"
        overflowX="hidden"
        mb="5"
      >
        {words && (
          <Transcript
            time={playProgress}
            words={words}
            pressed={(time) => videoRef.current.seekTo(time)}
          />
        )}
      </Box>
      <NextLink href="/" passHref>
        <Button as="a" leftIcon={<ArrowLeft />}>
          Back
        </Button>
      </NextLink>
      {text && (
        <HStack mt="5">
          <CircularProgress isIndeterminate color="green.300" size="30px" />
          <Text mr="10" fontSize="xl">
            {text}
          </Text>
        </HStack>
      )}
      {error && <Text color="red">{error}</Text>}
    </Box>
  );
};

export default VideoIdLoad;
