import type { NextPage } from "next";
import { Box, Button, CircularProgress, HStack, Text } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import {
  ClassBlock,
  getSponsoredPhrases,
  getText,
  getTranscript,
  matchPhrasesToTimestamps,
} from "lib/api";
import { ArrowLeft } from "react-feather";
import NextLink from "next/link";
import { useRouter } from "next/router";

const VideoIdLoad: NextPage = () => {
  const router = useRouter();

  const [text, setText] = useState<string | null>("Loading Transcript");
  const [error, setError] = useState<string | null>(null);
  const [phrases, setPhrases] = useState<ClassBlock[] | null>(null);

  useEffect(() => {
    if (router.isReady) {
      const videoId = router.query.videoId as string;
      (async () => {
        try {
          const transcript = await getTranscript(videoId as string);
          setText("Locating sponsors");
          const fetchedPhrases = await getSponsoredPhrases(getText(transcript));
          setText(null);
          setPhrases(fetchedPhrases);
          matchPhrasesToTimestamps(fetchedPhrases, transcript);
        } catch (e) {
          setError(
            "Error occured. Please try again, or with a different video."
          );
        }
      })();
    }
  }, [router.isReady]);

  return (
    <Box p="24">
      <Box
        maxHeight="96"
        overflow="scroll"
        width="50%"
        minWidth="750px"
        overflowX="hidden"
        mb="5"
      >
        {phrases
          ? phrases.map(({ sponsor, phrase }, i) => {
              return (
                <Box key={i} as="span" color={sponsor ? "red.400" : "black"}>
                  {phrase}
                </Box>
              );
            })
          : null}
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
