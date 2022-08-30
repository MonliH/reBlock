import Image from "next/image";
import logo from "../../public/reBlock_Logo.png";
import NextLink from "next/link";
import { Link } from "@chakra-ui/react";

const Header = () => {
  const width = 480;
  const aspect = 1906 / 578;
  return (
    <NextLink href="/" passHref>
      <Link>
        <Image
          src={logo}
          alt="reBlock Logo"
          width={`${width}px`}
          height={`${width / aspect}px`}
        ></Image>
      </Link>
    </NextLink>
  );
};

export default Header;
