import importlib.util
import sys
import unittest
from pathlib import Path
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("publish_blog", ROOT / "scripts" / "publish_blog.py")
publish_blog = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = publish_blog
SPEC.loader.exec_module(publish_blog)


def article_with_words(target_words):
    headings = [
        "Key Takeaways",
        "What this guide covers",
        "What buyers should understand first",
        "Which buyers is this most relevant for?",
        "How to compare options before ordering",
        "Buyer checklist before requesting a quote",
        "FAQ",
    ]
    body = "".join(f"<h2>{heading}</h2><p>Useful buyer guidance.</p>" for heading in headings)
    missing = target_words - len(__import__("re").sub(r"<[^>]+>", " ", body).split())
    body += f"<p>{' '.join(['procurement'] * missing)}</p>"
    return {
        "title": "A complete sourcing guide",
        "meta_description": "A practical wholesale sourcing guide for professional buyers.",
        "excerpt": "A practical guide for clinics, spas, resellers and distributors preparing product comparisons, documentation questions, shipping plans and a clear wholesale quotation request.",
        "read_time": "8 min read",
        "html_body": body,
    }


class GenerateValidArticleTests(unittest.TestCase):
    def setUp(self):
        self.topic = {"title": "Buyer guide", "keyword": "buyer guide", "category": "Supplies"}

    def test_repairs_the_existing_short_draft(self):
        short = article_with_words(750)
        repaired = article_with_words(950)
        with patch.object(publish_blog, "generate", return_value=short), patch.object(
            publish_blog, "repair_article", return_value=repaired
        ) as repair:
            result = publish_blog.generate_valid_article(self.topic)
        self.assertIs(result, repaired)
        repair.assert_called_once_with(self.topic, short, "Article too short: 750 words")

    def test_uses_structurally_valid_floor_after_repairs(self):
        short = article_with_words(750)
        with patch.object(publish_blog, "generate", return_value=short), patch.object(
            publish_blog, "repair_article", return_value=short
        ):
            result = publish_blog.generate_valid_article(self.topic)
        self.assertEqual(publish_blog.article_word_count(result), 750)

    def test_rejects_draft_below_publishable_floor(self):
        too_short = article_with_words(699)
        with patch.object(publish_blog, "generate", return_value=too_short), patch.object(
            publish_blog, "repair_article", return_value=too_short
        ):
            with self.assertRaisesRegex(RuntimeError, "Article generation failed after 3 attempts"):
                publish_blog.generate_valid_article(self.topic)


if __name__ == "__main__":
    unittest.main()
