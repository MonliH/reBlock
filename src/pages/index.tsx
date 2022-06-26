import type { NextPage } from "next";
import { Box, Button, Heading, Input, Text } from "@chakra-ui/react";
import { useState } from "react";
import { getId, getTranscript } from "../lib/api";
import { ArrowRight } from "react-feather";
import NextLink from "next/link";
import { useRouter } from "next/router";
import Header from "components/Header";

const Home: NextPage = () => {
  const [id, setId] = useState<string | null>(null);
  const [empty, setEmpty] = useState<boolean>(true);

  return (
    <Box p="24" pt="14">
      <Header />
      <Box mb="3">
        <Text>Enter Youtube URL:</Text>
        <Input
          onChange={(e) => {
            setId(getId(e.target.value));
            if (e.target.value === "") {
              setEmpty(true);
            } else {
              setEmpty(false);
            }
          }}
        ></Input>
      </Box>
      {id === null ? (
        <Button
          as="a"
          colorScheme="green"
          disabled={id === null}
          rightIcon={<ArrowRight />}
        >
          View Without Sponsors
        </Button>
      ) : (
        <NextLink href={`/video/${id}`} passHref>
          <Button
            as="a"
            colorScheme="green"
            disabled={id === null}
            rightIcon={<ArrowRight />}
          >
            View Without Sponsors
          </Button>
        </NextLink>
      )}

      {id === null && !empty && (
        <Text color="red" mt="2">
          Invalid Youtube URL
        </Text>
      )}
    </Box>
  );
};

export default Home;
