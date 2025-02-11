import dynamic from "next/dynamic";

export const getDynamicIcon = (iconName) => {
  const Icon = dynamic(() => import("react-icons/fa").then((mod) => mod[iconName]));
  return Icon;
}