# -*- coding: utf-8 -*-
"""E2E verification for Quiz.vue enhancements on softdesigner."""
import sys
from playwright.sync_api import sync_playwright

BASE = 'http://localhost:4173/meta-cert'
results = []

def check(name, cond, detail=''):
    results.append((name, bool(cond), detail))
    print(('PASS' if cond else 'FAIL'), '-', name, detail if detail else '')

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context()
    page = ctx.new_page()

    # 1) Chapter page: quiz should be filtered to chapter 1 (20 questions)
    page.goto(f'{BASE}/softdesigner/ch01.html', wait_until='networkidle')
    page.wait_for_selector('.quiz-container', timeout=10000)
    prog = page.locator('.quiz-progress').first.inner_text()
    check('ch01 quiz shows 1/20', prog.strip() == '1 / 20', f'got: {prog.strip()}')

    # chapter badge
    badge = page.locator('.badge-chapter').first.inner_text()
    check('ch01 chapter badge', badge.strip() == '第 1 章', f'got: {badge.strip()}')

    # 2) Click an index anchor link (softdesigner-003)
    anchor = page.locator('a[href="#softdesigner-003"]').first
    anchor.click()
    page.wait_for_timeout(800)
    prog2 = page.locator('.quiz-progress').first.inner_text()
    hash_val = page.evaluate('window.location.hash')
    check('anchor click updates hash', '#softdesigner-003' in hash_val, f'hash: {hash_val}')
    check('quiz jumped to question 3', prog2.strip() == '3 / 20', f'got: {prog2.strip()}')

    # 3) Answer question 3 (correct answer is C -> option index 2) and submit
    page.locator('.option-item').nth(2).click()
    page.locator('text=提交答案').first.click()
    page.wait_for_timeout(500)
    score = page.locator('.quiz-score').first.inner_text()
    check('score increments after submit', '得分: 1' in score, f'got: {score.strip()}')

    # 4) localStorage progress (quiz-local + global meta-cert:progress)
    local_quiz = page.evaluate("localStorage.getItem('quiz_progress_./quiz.json')")
    check('quiz-local storage written', local_quiz is not None and 'softdesigner-003' in local_quiz, f'len={len(local_quiz or "")}')
    global_prog = page.evaluate("localStorage.getItem('meta-cert:progress')")
    check('global progress written', global_prog is not None and 'softdesigner' in global_prog, f'has softdesigner={bool(global_prog and "softdesigner" in global_prog)}')

    # 5) Switch chapter filter to chapter 3 -> answer state must NOT bleed (question id keyed)
    page.locator('.chapter-select').select_option('3')
    page.wait_for_timeout(500)
    prog3 = page.locator('.quiz-progress').first.inner_text()
    score3 = page.locator('.quiz-score').first.inner_text()
    check('filter switch keeps score but resets position', prog3.strip() == '1 / 20' and '得分: 1' in score3, f'got: {prog3.strip()} / {score3.strip()}')

    # 6) Back to chapter 1: previous answer restored by id
    page.locator('.chapter-select').select_option('1')
    page.wait_for_timeout(500)
    page.locator('.nav-dot').nth(2).click()  # question 3
    page.wait_for_timeout(400)
    result_shown = page.locator('.analysis-box').count() > 0
    check('answer restored by question id', result_shown, 'analysis box visible')

    # 7) Quiz page shows all 160 questions (fresh context, no saved position)
    ctx2 = browser.new_context()
    page2 = ctx2.new_page()
    page2.goto(f'{BASE}/softdesigner/quiz.html', wait_until='networkidle')
    page2.wait_for_selector('.quiz-container', timeout=10000)
    prog_all = page2.locator('.quiz-progress').first.inner_text()
    check('quiz page shows 1/160', prog_all.strip() == '1 / 160', f'got: {prog_all.strip()}')
    page2.close()
    ctx2.close()

    # 8) Direct URL hash entry: /softdesigner/quiz.html#softdesigner-121
    page.goto(f'{BASE}/softdesigner/quiz.html#softdesigner-121', wait_until='networkidle')
    page.wait_for_selector('.quiz-container', timeout=10000)
    page.wait_for_timeout(800)
    prog121 = page.locator('.quiz-progress').first.inner_text()
    check('direct hash lands on question 121 (ch7)', prog121.strip() == '1 / 20', f'got: {prog121.strip()}')

    # 9) Progress dashboard shows softdesigner subject
    page.goto(f'{BASE}/progress.html', wait_until='networkidle')
    page.wait_for_timeout(800)
    body = page.locator('body').inner_text()
    check('progress page shows 软件设计师', '软件设计师' in body, '')

    browser.close()

failed = [r for r in results if not r[1]]
print()
print('=' * 60)
print(f'TOTAL: {len(results) - len(failed)}/{len(results)} passed')
if failed:
    for name, _, detail in failed:
        print('FAILED:', name, detail)
    sys.exit(1)
