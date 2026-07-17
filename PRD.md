# Product Requirements Document (PRD)

# Product Name

**Personal Knowledge Garden**

---

# Vision

Create a minimal personal website that combines a technical blog, portfolio, and private writing workspace into a single experience.

The platform should encourage writing first and organizing later. It should make it effortless to capture ideas from any device, refine them over time, and selectively publish them as polished articles or project write-ups.

The website itself should reflect how I think, learn, and build software—not simply act as a resume.

---

# Problem Statement

Developers frequently consume technical content and have ideas worth recording, but existing platforms separate note-taking, blogging, and portfolios into different products.

This project aims to unify those workflows while remaining intentionally simple.

---

# Goals

* Capture thoughts with minimal friction.
* Write long-form technical articles.
* Showcase projects.
* Organize content through tags.
* Publish only when ready.

---

# Product Structure

The website consists of four primary sections.

## 1. Home

Landing page introducing the person behind the website.

Contains:

* Short introduction
* Featured blogs
* Featured projects
* Links to other sections
* Social links

---

## 2. Blogs

A collection of published technical articles.

Each article contains:

* Title
* Date
* Tags
* Reading time
* Markdown content
* Code highlighting
* Table of contents (when applicable)

Users can browse blogs by tag.

---

## 3. Portfolio

A showcase of projects.

Each project contains:

* Name
* Description
* Technologies
* Architecture overview
* Screenshots
* GitHub link
* Live demo (optional)
* Lessons learned

Projects can also be tagged.

---

## 4. Thought Capture (Private Workspace)

A private area used for collecting ideas before they become articles or projects.

This is the default place where writing begins.

Each thought contains:

* Title (optional)
* Markdown content
* Tags
* Creation date
* Last updated

Thoughts remain editable indefinitely.

A thought can later be:

* Published as a blog
* Converted into a project write-up
* Left unpublished

---

# Core Features

## Markdown Editor

Used for both blogs and thoughts.

Supports:

* Headings
* Lists
* Links
* Images
* Code blocks
* Syntax highlighting

---

## Tags

Tags are the primary organization mechanism.

Tags should work consistently across:

* Blogs
* Projects
* Thoughts

Users should be able to filter Blogs and Portfolio by tag.

---

## Draft → Publish Workflow

Writing starts as a thought.

When ready, a thought can be published as:

* Blog
* Project documentation

This workflow should require minimal effort.

---

## Dark Mode

Support:

* Light mode
* Dark mode
* Persist user preference

---

# Admin

A single authenticated admin interface.

Capabilities:

* Create, edit, delete thoughts
* Publish thoughts as blogs
* Manage projects
* Manage tags
* Upload images
* View per-blog analytics (views and basic engagement metrics)

No public analytics dashboard is required.

---

# Non-Functional Requirements

## Performance

* Fast page loads
* Mobile-friendly editing
* Responsive layout

---

## Simplicity

The product should prioritize clarity over features.

Avoid unnecessary complexity in navigation, content organization, and publishing workflow.

---

# MVP Scope

The initial version should include:

* Home page
* Blogs
* Portfolio
* Private Thought Capture area
* Markdown editor
* Tag system
* Draft-to-publish workflow
* Dark mode
* Admin panel
* Per-blog analytics

Everything else is intentionally out of scope until the core writing experience is validated.

---

# Product Principles

1. Writing should begin with a thought, not a blog post.
2. The portfolio should communicate problem-solving, not just completed work.
3. Tags are the only organizational system.
4. Every feature should reduce friction for writing and publishing.
5. Simplicity is preferred over feature richness.
