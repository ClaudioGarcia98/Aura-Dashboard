import defaultVideo from '../assets/animated_gif.mp4';

// A shared object prevents the bundler from duplicating the large inline video
// literal into each background restore path in the portable HTML build.
export const DEFAULT_BACKGROUND = Object.freeze({ url: defaultVideo });
