/**
 * Single source of truth for the Video Tutorials section (/tutorials).
 *
 * Edit this file to:
 *  - rename/add/remove software (Level 1 grid)
 *  - rename/add/remove tutorial topics per software (Level 2 grid)
 *  - swap in real thumbnail images (drop files in /public/tutorials/... and
 *    set `thumbnail` to that path — leave undefined for the gray
 *    placeholder + play icon)
 *  - paste in real YouTube links once videos are recorded
 *
 * Nothing in app/tutorials/**\/page.tsx needs to change when you edit this.
 */

export type TutorialVideo = {
  /** Stable id, also used as the React key. */
  id: string;
  title: string;
  /** Optional path/URL to a real thumbnail image. Omit for a placeholder. */
  thumbnail?: string;
  youtubeUrl: string;
};

export type TutorialSoftware = {
  /** URL slug — page lives at /tutorials/[slug]. */
  slug: string;
  /** Full display name, shown on the Level 1 software card. */
  name: string;
  /** Short display name, used in the breadcrumb and page heading. */
  shortName: string;
  /** Optional path/URL to a real logo image. Omit for the placeholder mark. */
  icon?: string;
  videos: TutorialVideo[];
};

export const tutorialSoftwareList: TutorialSoftware[] = [
  {
    slug: "tsd",
    name: "Tekla Structural Designer (TSD)",
    shortName: "TSD",
    videos: [
      {
        id: "tsd-getting-started",
        title: "Getting Started with TSD",
        youtubeUrl: "https://youtube.com/watch?v=PLACEHOLDER",
      },
      {
        id: "tsd-wind-load-analysis",
        title: "Wind Load Analysis in TSD",
        youtubeUrl: "https://youtube.com/watch?v=PLACEHOLDER",
      },
      {
        id: "tsd-rc-design",
        title: "Reinforced Concrete Design Workflow",
        youtubeUrl: "https://youtube.com/watch?v=PLACEHOLDER",
      },
      {
        id: "tsd-steel-design",
        title: "Steel Member Design & Optimisation",
        youtubeUrl: "https://youtube.com/watch?v=PLACEHOLDER",
      },
      {
        id: "tsd-model-import",
        title: "Importing Models from Tekla Structures",
        youtubeUrl: "https://youtube.com/watch?v=PLACEHOLDER",
      },
      {
        id: "tsd-report-generation",
        title: "Generating Calculation Reports",
        youtubeUrl: "https://youtube.com/watch?v=PLACEHOLDER",
      },
    ],
  },
  {
    slug: "tedds",
    name: "Tedds",
    shortName: "Tedds",
    videos: [
      {
        id: "tedds-getting-started",
        title: "Getting Started with Tedds",
        youtubeUrl: "https://youtube.com/watch?v=PLACEHOLDER",
      },
      {
        id: "tedds-custom-calcs",
        title: "Building Custom Calculations",
        youtubeUrl: "https://youtube.com/watch?v=PLACEHOLDER",
      },
      {
        id: "tedds-library",
        title: "Using the Calculation Library",
        youtubeUrl: "https://youtube.com/watch?v=PLACEHOLDER",
      },
      {
        id: "tedds-word-export",
        title: "Exporting Calculations to Word",
        youtubeUrl: "https://youtube.com/watch?v=PLACEHOLDER",
      },
    ],
  },
  {
    slug: "autocad",
    name: "AutoCAD",
    shortName: "AutoCAD",
    videos: [
      {
        id: "autocad-getting-started",
        title: "Getting Started with AutoCAD",
        youtubeUrl: "https://youtube.com/watch?v=PLACEHOLDER",
      },
      {
        id: "autocad-layers",
        title: "Layer Management for Structural Drawings",
        youtubeUrl: "https://youtube.com/watch?v=PLACEHOLDER",
      },
      {
        id: "autocad-blocks",
        title: "Working with Blocks & Dynamic Blocks",
        youtubeUrl: "https://youtube.com/watch?v=PLACEHOLDER",
      },
      {
        id: "autocad-layouts",
        title: "Sheet Layouts & Plotting",
        youtubeUrl: "https://youtube.com/watch?v=PLACEHOLDER",
      },
      {
        id: "autocad-shortcuts",
        title: "Essential Keyboard Shortcuts",
        youtubeUrl: "https://youtube.com/watch?v=PLACEHOLDER",
      },
    ],
  },
  {
    slug: "revit",
    name: "Revit",
    shortName: "Revit",
    videos: [
      {
        id: "revit-getting-started",
        title: "Getting Started with Revit",
        youtubeUrl: "https://youtube.com/watch?v=PLACEHOLDER",
      },
      {
        id: "revit-structural-modelling",
        title: "Structural Modelling Basics",
        youtubeUrl: "https://youtube.com/watch?v=PLACEHOLDER",
      },
      {
        id: "revit-rebar-detailing",
        title: "Rebar Detailing in Revit",
        youtubeUrl: "https://youtube.com/watch?v=PLACEHOLDER",
      },
      {
        id: "revit-collaboration",
        title: "Collaboration with Worksharing",
        youtubeUrl: "https://youtube.com/watch?v=PLACEHOLDER",
      },
      {
        id: "revit-schedules",
        title: "Creating Schedules & Quantities",
        youtubeUrl: "https://youtube.com/watch?v=PLACEHOLDER",
      },
    ],
  },
];

export function getSoftwareBySlug(slug: string): TutorialSoftware | undefined {
  return tutorialSoftwareList.find((software) => software.slug === slug);
}
