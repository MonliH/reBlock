import Image from "next/image";
import logo from "../../public/reBlock_Logo.png";

const Header = () => {
  const width = 480;
  const aspect = 1906 / 578;
  return (
    <Image
      style={{ marginLeft: "-17px" }}
      src={logo}
      alt="reBlock Logo"
      width={`${width}px`}
      height={`${width / aspect}px`}
    ></Image>
  );
};

export default Header;
