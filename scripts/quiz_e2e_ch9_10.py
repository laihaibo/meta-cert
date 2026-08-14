# -*- coding: utf-8 -*-
"""E2E verification for new chapters ch09/ch10 and expanded quiz."""
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

    # 1) ch09 page loads, quiz filtered to chapter 9 (20 questions)
    page.goto(f'{BASE}/softdesigner/ch09.html', wait_until='networkidle')
    page.wait_for_selector('.quiz-container', timeout=10000)
    prog = page.locator('.quiz-progress').first.inner_text()
    check('ch09 quiz shows 1/20', prog.strip() == '1 / 20', f'got: {prog.strip()}')
    badge = page.locator('.badge-chapter').first.inner_text()
    check('ch09 badge', badge.strip() == '第 9 章', f'got: {badge.strip()}')

    # 2) anchor jump to softdesigner-164 (subnet calc)
    page.locator('a[href="#softdesigner-164"]').first.click()
    page.wait_for_timeout(800)
    prog2 = page.locator('.quiz-progress').first.inner_text()
    check('ch09 anchor jumps to q4', prog2.strip() == '4 / 20', f'got: {prog2.strip()}')

    # 3) ch10 page quiz filtered to chapter 10 (clear saved position first)
    page.evaluate("localStorage.removeItem('quiz_progress_./quiz.json')")
    page.goto(f'{BASE}/softdesigner/ch10.html', wait_until='networkidle')
    page.wait_for_selector('.quiz-container', timeout=10000)
    prog3 = page.locator('.quiz-progress').first.inner_text()
    check('ch10 quiz shows 1/20', prog3.strip() == '1 / 20', f'got: {prog3.strip()}')
    badge3 = page.locator('.badge-chapter').first.inner_text()
    check('ch10 badge', badge3.strip() == '第 10 章', f'got: {badge3.strip()}')

    # 4) anchor jump to softdesigner-181 (patent term)
    page.locator('a[href="#softdesigner-181"]').first.click()
    page.wait_for_timeout(800)
    prog4 = page.locator('.quiz-progress').first.inner_text()
    check('ch10 anchor jumps to q1', prog4.strip() == '1 / 20', f'got: {prog4.strip()}')

    # 5) quiz page total count is now 240
    ctx2 = browser.new_context()
    page2 = ctx2.new_page()
    page2.goto(f'{BASE}/softdesigner/quiz.html', wait_until='networkidle')
    page2.wait_for_selector('.quiz-container', timeout=10000)
    prog5 = page2.locator('.quiz-progress').first.inner_text()
    check('quiz page shows 1/240', prog5.strip() == '1 / 240', f'got: {prog5.strip()}')
    # chapter select should have 10 options + "全部章节"
    opts = page2.locator('.chapter-select option').all_inner_texts()
    check('quiz has 10 chapter options', len(opts) == 11 and opts[0] == '全部章节', f'got: {len(opts)} options')
    # select chapter 9 -> 1/20
    page2.locator('.chapter-select').select_option('9')
    page2.wait_for_timeout(500)
    prog6 = page2.locator('.quiz-progress').first.inner_text()
    check('filter to ch9 shows 1/20', prog6.strip() == '1 / 20', f'got: {prog6.strip()}')
    # select chapter 10
    page2.locator('.chapter-select').select_option('10')
    page2.wait_for_timeout(500)
    prog7 = page2.locator('.quiz-progress').first.inner_text()
    check('filter to ch10 shows 1/20', prog7.strip() == '1 / 20', f'got: {prog7.strip()}')
    page2.close()
    ctx2.close()

    # 6) sidebar shows new chapters
    page.goto(f'{BASE}/softdesigner/', wait_until='networkidle')
    page.wait_for_timeout(800)
    body = page.locator('body').inner_text()
    check('sidebar/index shows 第十章', '第十章 标准化与知识产权' in body, '')
    check('index table shows 第九章', '计算机网络基础' in body, '')

    browser.close()

failed = [r for r in results if not r[1]]
print()
print('=' * 60)
print(f'TOTAL: {len(results) - len(failed)}/{len(results)} passed')
if failed:
    for name, _, detail in failed:
        print('FAILED:', name, detail)
    sys.exit(1)
