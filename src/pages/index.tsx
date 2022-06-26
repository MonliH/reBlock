import type { NextPage } from "next";
import {
  Box,
  Button,
  Divider,
  Heading,
  Input,
  Link,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";
import { getId, getTranscript } from "../lib/api";
import { ArrowRight } from "react-feather";
import NextLink from "next/link";
import { useRouter } from "next/router";
import Header from "components/Header";

const Home: NextPage = () => {
  const [id, setId] = useState<string | null>(null);
  const [empty, setEmpty] = useState<boolean>(true);
  const router = useRouter();

  return (
    <Box p="24" pt="14">
      <Header />
      <Text mt="-5px" mb="5" fontSize="lg" fontWeight="bold">
        Block youtube sponsors using state-of-the-art natural language models!
        {"  "}
        <Link
          fontWeight={"normal"}
          href="https://github.com/MonliH/reBlock"
          ml="1px"
          textDecor={"underline"}
          color={"blue.400"}
        >
          See Code on Github
        </Link>
      </Text>
      <Divider />
      <Box mb="3" mt="12">
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
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (id) {
                router.replace(`/video/${id}`);
              }
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
