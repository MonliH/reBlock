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

const Transcript = ({
  words,
  pressed,
  time,
}: {
  words: SponsorInfo[];
  time: number;
  pressed: (time: number) => void;
}) => {
  const merged = useMemo(() => {
    const chunked = chunk(words, 10);
    const final = chunked.map((chunk) => getSpansWithWord(chunk));
    return final;
  }, [words.length]);

  return (
    <VStack alignItems={"left"} spacing={0}>
      {merged.map((span, value) => {
        return (
          <HStack
            py="2"
            px="2"
            key={value}
            onClick={() => pressed(span[0].start / 1000)}
            cursor="pointer"
            backgroundColor={
              time >= span[0].start / 1000 && time < span[0].end / 1000
                ? "green.100"
                : "transparent"
            }
          >
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
