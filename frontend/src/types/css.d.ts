// Allow CSS file imports in Next.js layout files
declare module "*.css" {
  const content: Record<string, string>;
  export default content;
}
