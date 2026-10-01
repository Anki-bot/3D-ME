// Per-project hover media + outbound destinations for the SolarSystem
// WebGL fly-through. Kept in a separate module (not src/data/projects.ts)
// so the audited project-record shape stays byte-identical.
export interface ProjectMedia {
  hoverVideo: string;
  url: string;
}

export const projectMedia: Record<number, ProjectMedia> = {
  1: { hoverVideo: "/videos/project-1-hover.mp4", url: "https://github.com/" },
  2: { hoverVideo: "/videos/project-2-hover.mp4", url: "https://github.com/" },
  3: { hoverVideo: "/videos/project-3-hover.mp4", url: "https://github.com/" },
  4: { hoverVideo: "/videos/project-1-hover.mp4", url: "https://github.com/" },
  5: { hoverVideo: "/videos/project-2-hover.mp4", url: "https://github.com/" },
  6: { hoverVideo: "/videos/project-3-hover.mp4", url: "https://github.com/" },
  7: { hoverVideo: "/videos/project-1-hover.mp4", url: "https://github.com/" },
  8: { hoverVideo: "/videos/project-2-hover.mp4", url: "https://github.com/" },
};

export const getProjectMedia = (id: number): ProjectMedia =>
  projectMedia[id];
