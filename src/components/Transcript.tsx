import { Box, HStack, Text, VStack } from "@chakra-ui/react";
import {
  chunk,
  ClassBlock,
  formatTime,
  getSpans,
  getSpansWithWord,
  hms,
  SponsorInfo,
} from "lib/api";
import { useMemo } from "react";

const Transcript = ({ words }: { words: SponsorInfo[]; time: number }) => {
  const merged = useMemo(() => {
    const chunked = chunk(words, 10);
    const final = chunked.map((chunk) => getSpansWithWord(chunk));
    return final;
  }, [words.length]);

  return (
    <VStack alignItems={"left"} spacing="2">
      {merged.map((span, value) => {
        return (
          <HStack key={value}>
            <Box
              padding="1"
              bgColor="gray.200"
              width="4em"
              textAlign="center"
              borderRadius="4"
              fontSize="sm"
            >
              {formatTime(span[0].start / 1000)}
            </Box>
            {span.map((phrase, index) => {
              return (
                <Text
                  color={phrase.isSponsor ? "red.400" : "black"}
                  key={`${index}_${value}`}
                  as="span"
                >
                  {phrase.words.join(" ") + " "}
                </Text>
              );
            })}
          </HStack>
        );
      })}
    </VStack>
  );
};

export default Transcript;
