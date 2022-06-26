import type { NextPage } from "next";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Heading,
  HStack,
  Slider,
  SliderFilledTrack,
  SliderMark,
  SliderThumb,
  SliderTrack,
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
  const spansRef = useRef<Span[] | null>(null);
  const [words, setWords] = useState<SponsorInfo[] | null>(null);

  const videoId = router.query.videoId as string;

  useEffect(() => {
    if (router.isReady) {
      (async () => {
        try {
          const transcript = await getTranscript(videoId as string);
          setText("Locating sponsors");
          setError(null);
          const fetchedPhrases = await getSponsoredPhrases(getText(transcript));
          setText(null);
          setError(null);
          const words = matchPhrasesToTimestamps(fetchedPhrases, transcript);
          if (!words) {
            setError("Could not find any phrases");
          } else {
            setWords(words);
            setError(null);
            const spans = getSpans(words);
            spansRef.current = spans;
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
    if (spansRef.current) {
      for (const span of spansRef.current) {
        const millis = time * 1000;
        if (span.isSponsor && span.start <= millis && span.end > millis) {
          videoRef.current.seekTo(span.end / 1000);
          setPlayProgress(span.end / 1000);
          return;
        }
      }
    }
    setPlayProgress(time);
  };

  return (
    <Box p="24" pt="14">
      <Header />
      <Divider />
      <br />
      <NextLink href="/" passHref>
        <Button as="a" leftIcon={<ArrowLeft />} mb="10">
          Back
        </Button>
      </NextLink>
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
      <Text mt="4">
        Time: <b>{formatTime(playProgress)}</b>
      </Text>
      {videoRef.current && (
        <Slider
          width="min(100%, calc(65vh * 16/9))"
          overflow="hidden"
          height="25px"
          aria-label="slider-ex-1"
          defaultValue={0}
          min={0}
          max={1}
          step={0.001}
          value={playProgress / videoRef.current.getDuration()}
          onChange={(value) => {
            const sec = value * videoRef.current.getDuration();
            setPlayProgress(sec);
            videoRef.current.seekTo(sec);
          }}
        >
          {spans &&
            spans.map((span, i) => {
              return span.isSponsor ? (
                <SliderMark
                  value={span.start / 1000 / videoRef.current.getDuration()}
                  key={i}
                  width="100%"
                >
                  <Box
                    position="absolute"
                    width={`${Math.max(
                      (span.end - span.start) /
                        videoRef.current.getDuration() /
                        10,
                      1
                    )}%`}
                    height="7px"
                    bgColor={"red.400"}
                    borderRadius="10px"
                    top={"10px"}
                    left={0}
                  ></Box>
                </SliderMark>
              ) : null;
            })}
          <SliderTrack>
            <SliderFilledTrack />
          </SliderTrack>
          <SliderThumb
            boxShadow="md"
            borderWidth="1px"
            borderColor="gray.200"
          />
        </Slider>
      )}
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
