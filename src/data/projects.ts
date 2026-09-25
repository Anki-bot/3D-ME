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
      "An interactive commerce experience combining cinematic motion, immersive storytelling, and a refined digital interface.",
    image: "/images/project-1.jpg",
  },
  {
    id: 2,
    title: "Creative Portfolio",
    category: "Digital Experience",
    year: "2026",
    description:
      "A cinematic portfolio experience built around expressive typography, fluid transitions, and interactive visual storytelling.",
    image: "/images/project-2.jpg",
  },
  {
    id: 3,
    title: "Motion Studio",
    category: "Brand Experience",
    year: "2026",
    description:
      "A contemporary brand experience focused on art direction, motion design, elegant typography, and high-performance interactions.",
    image: "/images/project-3.jpg",
  },
  {
    id: 4,
    title: "Neon Horizon",
    category: "Interactive Installation",
    year: "2025",
    description:
      "An experimental installation merging light, sound, and spatial interaction for a multisensory journey.",
    image: "/images/project-1.jpg",
  },
  {
    id: 5,
    title: "Quantum Interface",
    category: "Web Application",
    year: "2025",
    description:
      "A data-driven interface visualizing complex systems through minimal, high-contrast interactions.",
    image: "/images/project-2.jpg",
  },
  {
    id: 6,
    title: "Echo Chamber",
    category: "Digital Art",
    year: "2024",
    description:
      "A generative art experience exploring repetition, reflection, and digital memory.",
    image: "/images/project-3.jpg",
  },
  {
    id: 7,
    title: "Lunar Archive",
    category: "Brand Experience",
    year: "2024",
    description:
      "A archival brand system for a lunar research collective, blending science and speculative fiction.",
    image: "/images/project-1.jpg",
  },
  {
    id: 8,
    title: "Stellar Network",
    category: "Web Experience",
    year: "2023",
    description:
      "A networked storytelling platform connecting distributed creators across a shared orbital narrative.",
    image: "/images/project-2.jpg",
  },
];