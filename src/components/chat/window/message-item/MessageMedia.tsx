import React from "react";
import Image from "next/image";

interface Props {
  src: string;
  onClick?: () => void;
}

const MessageMedia: React.FC<Props> = ({ src, onClick }) => {
  return (
    <div className="relative overflow-hidden rounded-b-xl">
      <Image
        src={src}
        alt="sent"
        width={150}
        height={100}
        className="w-full max-h-80 object-cover cursor-pointer hover:scale-[1.02] transition-transform duration-300"
        onClick={onClick}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
};

export default MessageMedia;
