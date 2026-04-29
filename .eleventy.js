export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "site/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ schemas: "schemas" });
  eleventyConfig.addPassthroughCopy({ examples: "examples" });
  eleventyConfig.addPassthroughCopy({ "L10N.md": "L10N.md" });

  eleventyConfig.addFilter("prettyJson", (value) => JSON.stringify(value, null, 2));

  return {
    dir: {
      input: "site",
      includes: "_includes",
      data: "_data",
      output: "_site",
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"],
  };
}
