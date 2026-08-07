export interface Project {
  id: number;
  title: string;
  category: string;
  year: string;
  description: string;
  image: string;
}

export const projects: Project[] = [
  {
    id: 1,
    title: "Immersive Commerce",
    category: "Web Experience",
    year: "2026",
    description:
      "An interactive e-commerce experience combining smooth animations, immersive storytelling, and modern UI.",
    image: "/images/project-1.jpg",
  },
  {
    id: 2,
    title: "Creative Portfolio",
    category: "Portfolio",
    year: "2026",
    description:
      "A premium portfolio experience featuring cinematic transitions, WebGL visuals, and interactive storytelling.",
    image: "/images/project-2.jpg",
  },
  {
    id: 3,
    title: "Motion Studio",
    category: "Brand Experience",
    year: "2026",
    description:
      "A digital brand experience focused on elegant typography, motion design, and high-performance interactions.",
    image: "/images/project-3.jpg",
  },
];