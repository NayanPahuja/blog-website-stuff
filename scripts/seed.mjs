import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL);

try {
  // Insert a tag
  const [tag] = await sql`
    INSERT INTO tags (name, slug)
    VALUES ('test', 'test')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  `;

  // Insert a blog with rich markdown
  const md = `## Hello World

This is a **test blog post** with various markdown features.

### Inline formatting

- **Bold text**
- *Italic text*
- ~~Strikethrough~~
- \`inline code\`
- [A link](https://example.com)

### Code block

\`\`\`javascript
function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return true;
}
\`\`\`

### Blockquote

> This is a blockquote.
> It spans multiple lines.

### Lists

1. First ordered item
2. Second ordered item
3. Third ordered item

- Unordered item
- Another unordered item
- Yet another item

### Table

| Feature | Status |
|---------|--------|
| Markdown | ✅ |
| Preview | ✅ |
| Tags | ✅ |

### Horizontal rule

---

### Image

![Placeholder](https://placehold.co/600x400/0062d1/ffffff?text=Test+Image)

That's all for now!
`;

  const [blog] = await sql`
    INSERT INTO blogs (title, slug, content_md, is_published, published_at, reading_time)
    VALUES ('Test Blog Post', 'test-blog', ${md}, true, NOW(), 2)
    ON CONFLICT (slug) DO UPDATE SET content_md = EXCLUDED.content_md, is_published = true, published_at = NOW()
    RETURNING id
  `;

  // Link tag to blog
  await sql`
    INSERT INTO blog_tags (blog_id, tag_id)
    VALUES (${blog.id}, ${tag.id})
    ON CONFLICT DO NOTHING
  `;

  console.log("Seed data inserted successfully");
  console.log(`Blog ID: ${blog.id}`);
  console.log("Visit: http://localhost:3000/blogs/test-blog");
} catch (e) {
  console.error("Seed failed:", e.message);
}

await sql.end();
