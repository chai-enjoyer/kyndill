import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import type { Page, Route, TestInfo } from '@playwright/test';

const USER_ID = '00000000-0000-4000-8000-000000000001';
const FRIEND_ID = '00000000-0000-4000-8000-000000000002';
const REQUEST_ID = '00000000-0000-4000-8000-000000000003';
const SENT_REQUEST_ID = '00000000-0000-4000-8000-000000000004';
const HABIT_ID = '00000000-0000-4000-8000-000000000010';
const WATER_ID = '00000000-0000-4000-8000-000000000011';
const MEDAL_ID = '00000000-0000-4000-8000-000000000020';
const SOUP_ID = '00000000-0000-4000-8000-000000000021';
const FOCUS_ID = '00000000-0000-4000-8000-000000000030';

const now = new Date('2026-05-13T09:00:00.000Z').toISOString();

export const mockUser = {
  id: USER_ID,
  email: 'iris@example.com',
  display_name: 'Iris Moon',
  username: 'iris',
  level: 4,
  xp: 960,
  coins: 128,
  streak_current: 7,
  streak_longest: 18,
  avatar_url: null,
  visibility: 'friends',
};

const mockProfile = {
  ...mockUser,
  bio: 'Testing Kyndill for daily care routines.',
  total_habits: 6,
  total_focus_minutes: 180,
  auth_provider: 'email',
  notification_prefs: {
    friendRequests: true,
    gifts: true,
    focusReminders: true,
  },
  research_consent: true,
};

const mockPet = {
  id: '00000000-0000-4000-8000-000000000040',
  user_id: USER_ID,
  species: 'star',
  name: 'Nova',
  health: 82,
  happiness: 88,
  hunger: 74,
  energy: 69,
  cleanliness: 91,
  stage: 2,
  total_habits_completed: 64,
  is_fainted: false,
  initialized_at: '2026-05-01T10:00:00.000Z',
  created_at: '2026-05-01T10:00:00.000Z',
  equipped: {
    hat: { id: 'hat-1', name: 'Wizard Hat', category: 'hat', rarity: 'rare' },
    badge: { id: MEDAL_ID, name: 'Medal', category: 'badge', rarity: 'common' },
  },
};

const mockHabits = [
  {
    id: HABIT_ID,
    user_id: USER_ID,
    name: 'Morning walk',
    description: 'Ten calm minutes outside.',
    category: 'Health',
    frequency: 'daily',
    days_of_week: null,
    completion_start_time: '07:00:00',
    completion_end_time: '11:00:00',
    target_count: 1,
    is_active: true,
    sort_order: 0,
    created_at: '2026-05-01T08:00:00.000Z',
    completed_today: true,
    completed_count: 1,
    today_target_count: 1,
    current_streak: 12,
  },
  {
    id: WATER_ID,
    user_id: USER_ID,
    name: 'Drink water',
    description: 'Four small check-ins across the day.',
    category: 'Wellness',
    frequency: 'daily',
    days_of_week: null,
    completion_start_time: null,
    completion_end_time: null,
    target_count: 4,
    is_active: true,
    sort_order: 1,
    created_at: '2026-05-02T08:00:00.000Z',
    completed_today: false,
    completed_count: 2,
    today_target_count: 4,
    current_streak: 5,
  },
  {
    id: '00000000-0000-4000-8000-000000000012',
    user_id: USER_ID,
    name: 'Read research notes',
    description: 'One page is enough.',
    category: 'Learning',
    frequency: 'weekly',
    days_of_week: [1, 3, 5],
    completion_start_time: null,
    completion_end_time: null,
    target_count: 1,
    is_active: false,
    sort_order: 2,
    created_at: '2026-05-03T08:00:00.000Z',
    completed_today: false,
    completed_count: 0,
    today_target_count: 1,
    current_streak: 3,
  },
];

const mockShop = {
  coins: mockUser.coins,
  freeze_count: 2,
  items: {
    cosmetic: [
      {
        id: MEDAL_ID,
        name: 'Medal',
        type: 'cosmetic',
        rarity: 'common',
        price: 18,
        effect_stat: null,
        effect_amount: null,
        image_url: null,
        category: 'badge',
        owned: true,
      },
      {
        id: '00000000-0000-4000-8000-000000000022',
        name: 'Cylinder Hat',
        type: 'cosmetic',
        rarity: 'rare',
        price: 42,
        effect_stat: null,
        effect_amount: null,
        image_url: null,
        category: 'hat',
        owned: false,
      },
      {
        id: '00000000-0000-4000-8000-000000000023',
        name: 'Sunglasses',
        type: 'cosmetic',
        rarity: 'rare',
        price: 38,
        effect_stat: null,
        effect_amount: null,
        image_url: null,
        category: 'glasses',
        owned: false,
      },
    ],
    consumable: [
      {
        id: SOUP_ID,
        name: 'Warm Soup',
        type: 'consumable',
        rarity: 'common',
        price: 8,
        effect_stat: 'hunger',
        effect_amount: 18,
        image_url: null,
        category: null,
      },
      {
        id: '00000000-0000-4000-8000-000000000024',
        name: 'Mint Tea',
        type: 'consumable',
        rarity: 'common',
        price: 7,
        effect_stat: 'energy',
        effect_amount: 12,
        image_url: null,
        category: null,
      },
    ],
    streak_freeze: [],
  },
};

const mockInventory = {
  consumables: mockShop.items.consumable.map((item) => ({
    ...item,
    quantity: 2,
    equipped_slot: null,
  })),
  cosmetics: mockShop.items.cosmetic
    .filter((item) => item.owned)
    .map((item) => ({
      ...item,
      quantity: 1,
      equipped_slot: item.category,
    })),
  streak_freezes: [
    {
      id: '00000000-0000-4000-8000-000000000025',
      name: 'Streak Freeze',
      type: 'streak_freeze',
      rarity: 'common',
      price: 35,
      effect_stat: null,
      effect_amount: null,
      image_url: null,
      category: null,
      quantity: 2,
      equipped_slot: null,
    },
  ],
};

const leaderboard = [
  { rank: 1, id: USER_ID, display_name: 'Iris Moon', username: 'iris', avatar_url: null, level: 4, xp: 960, streak_current: 7 },
  { rank: 2, id: FRIEND_ID, display_name: 'Mika Stone', username: 'mika', avatar_url: null, level: 3, xp: 710, streak_current: 5 },
  { rank: 3, id: '00000000-0000-4000-8000-000000000005', display_name: 'Noor Vale', username: 'noor', avatar_url: null, level: 2, xp: 420, streak_current: 4 },
  { rank: 4, id: '00000000-0000-4000-8000-000000000006', display_name: 'Ari Sun', username: 'ari', avatar_url: null, level: 2, xp: 360, streak_current: 2 },
];

const progressSummary = {
  generated_at: now,
  overview: {
    total_habits_created: 6,
    active_habits: 5,
    total_check_ins: 138,
    total_completed_days: 44,
    active_days: 21,
    current_streak: 7,
    longest_streak: 18,
    focus_minutes: 180,
    focus_sessions: 9,
    friends: 3,
    gifts_sent: 2,
    gifts_received: 4,
    feedback_entries: 8,
    recovery_reflections: 2,
    weekly_completion_rate: 76,
  },
  weekly: [
    { date: '2026-05-07', label: 'Thu', completed: 3, target: 4, rate: 75 },
    { date: '2026-05-08', label: 'Fri', completed: 4, target: 4, rate: 100 },
    { date: '2026-05-09', label: 'Sat', completed: 2, target: 3, rate: 67 },
    { date: '2026-05-10', label: 'Sun', completed: 0, target: 0, rate: null },
    { date: '2026-05-11', label: 'Mon', completed: 3, target: 5, rate: 60 },
    { date: '2026-05-12', label: 'Tue', completed: 5, target: 5, rate: 100 },
    { date: '2026-05-13', label: 'Wed', completed: 3, target: 4, rate: 75 },
  ],
  most_consistent_habit: {
    id: HABIT_ID,
    name: 'Morning walk',
    category: 'Health',
    completed_days: 12,
    expected_days: 14,
    rate: 86,
  },
  category_breakdown: [
    { category: 'Health', completions: 28, check_ins: 48 },
    { category: 'Wellness', completions: 18, check_ins: 52 },
    { category: 'Learning', completions: 11, check_ins: 21 },
    { category: 'Social', completions: 6, check_ins: 9 },
    { category: 'Productivity', completions: 5, check_ins: 8 },
  ],
  social: {
    friends: 3,
    gifts_sent: 2,
    gifts_received: 4,
  },
};

const friends = [
  { id: FRIEND_ID, display_name: 'Mika Stone', username: 'mika', avatar_url: null, level: 3, streak_current: 5 },
  { id: '00000000-0000-4000-8000-000000000005', display_name: 'Noor Vale', username: 'noor', avatar_url: null, level: 2, streak_current: null },
];

const activity = [
  {
    id: 'activity-1',
    user_id: USER_ID,
    user_display_name: 'Iris Moon',
    user_username: 'iris',
    user_avatar_url: null,
    type: 'habit_completed',
    metadata: {
      habit_name: 'Morning walk',
      coins_earned: 12,
      xp_earned: 20,
      new_streak: 7,
      completed_count: 1,
      target_count: 1,
      item_dropped: { item_name: 'Warm Soup' },
    },
    created_at: now,
    is_current_user: true,
  },
  {
    id: 'activity-2',
    user_id: FRIEND_ID,
    user_display_name: 'Mika Stone',
    user_username: 'mika',
    user_avatar_url: null,
    type: 'level_up',
    metadata: { new_level: 3 },
    created_at: '2026-05-13T08:30:00.000Z',
    is_current_user: false,
  },
];

export async function mockAuthenticatedApp(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem('kyndill_token', 'e2e-token');
  });

  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname;
    const method = route.request().method();

    if (method === 'GET' && pathname === '/api/auth/me') return json(route, mockUser);
    if (method === 'GET' && pathname === '/api/pet') return json(route, mockPet);
    if (method === 'PATCH' && pathname === '/api/pet/name') return json(route, mockPet);
    if (method === 'POST' && pathname === '/api/pet/feed') return json(route, { ...mockPet, hunger: 92 });
    if (method === 'POST' && pathname === '/api/pet/equip') return json(route, { equipped: mockPet.equipped });
    if (method === 'POST' && pathname === '/api/pet/unequip') return empty(route);

    if (method === 'GET' && pathname === '/api/habits') return json(route, { habits: mockHabits });
    if (method === 'POST' && pathname.endsWith('/complete')) {
      return json(route, {
        xp_earned: 20,
        coins_earned: 12,
        new_streak: 8,
        longest_streak: 18,
        item_dropped: mockShop.items.consumable[0],
        leveled_up: false,
        new_level: 4,
        pet_health: 84,
        pet_happiness: 90,
        pet_hunger: 72,
        pet_energy: 68,
        pet_cleanliness: 90,
        pet_total_habits_completed: 65,
        pet_is_fainted: false,
        completed_count: 4,
        target_count: 4,
        completed_today: true,
      });
    }
    if (method === 'POST' && pathname === '/api/habits') return json(route, mockHabits[0], 201);
    if (method === 'PUT' && pathname.startsWith('/api/habits/')) return json(route, mockHabits[0]);
    if (method === 'DELETE' && pathname.startsWith('/api/habits/')) return empty(route);
    if (method === 'POST' && pathname === '/api/habits/reorder') return empty(route);

    if (method === 'GET' && pathname === '/api/shop') return json(route, mockShop);
    if (method === 'POST' && pathname === '/api/shop/purchase') return json(route, { ok: true });
    if (method === 'POST' && pathname === '/api/shop/buy-streak-freeze') return json(route, { freeze_count: 3 });
    if (method === 'GET' && pathname === '/api/inventory') return json(route, mockInventory);

    if (method === 'GET' && pathname === '/api/social/activity') return json(route, { activity });
    if (method === 'GET' && pathname === '/api/social/friends') return json(route, { friends });
    if (method === 'GET' && pathname === '/api/social/friends/requests') {
      return json(route, {
        requests: [
          {
            id: REQUEST_ID,
            from_user_id: '00000000-0000-4000-8000-000000000007',
            from_username: 'sara',
            from_display_name: 'Sara Ash',
            from_avatar_url: null,
            status: 'pending',
            created_at: now,
          },
        ],
      });
    }
    if (method === 'GET' && pathname === '/api/social/friends/requests/sent') {
      return json(route, {
        requests: [
          {
            id: SENT_REQUEST_ID,
            to_user_id: '00000000-0000-4000-8000-000000000008',
            to_username: 'leo',
            to_display_name: 'Leo Reed',
            to_avatar_url: null,
            status: 'pending',
            created_at: now,
          },
        ],
      });
    }
    if (method === 'GET' && pathname === '/api/user/search') {
      return json(route, {
        users: [
          { id: '00000000-0000-4000-8000-000000000009', display_name: 'Remy Lake', username: 'remy', avatar_url: null, level: 2 },
        ],
      });
    }
    if (method === 'GET' && pathname === `/api/user/friends/${FRIEND_ID}/profile`) {
      return json(route, {
        id: FRIEND_ID,
        display_name: 'Mika Stone',
        username: 'mika',
        avatar_url: null,
        visibility: 'friends',
        level: 3,
        streak_current: 5,
        total_habits_completed: 31,
        pet: { species: 'sphere', name: 'Pebble', health: 78, is_fainted: false },
      });
    }
    if (method === 'POST' && pathname === '/api/social/friends/request') return json(route, { id: REQUEST_ID }, 201);
    if (method === 'PUT' && pathname.startsWith('/api/social/friends/request/')) return json(route, { ok: true });
    if (method === 'POST' && pathname === '/api/social/gifts/send') return json(route, { ok: true }, 201);

    if (method === 'GET' && pathname.startsWith('/api/leaderboard/')) return json(route, { entries: leaderboard });
    if (method === 'GET' && pathname === '/api/progress/summary') return json(route, progressSummary);
    if (method === 'GET' && pathname === '/api/recovery/prompt') return json(route, { prompt: null });
    if (method === 'POST' && pathname === '/api/recovery/reflection') return json(route, { ok: true }, 201);
    if (method === 'POST' && pathname === '/api/feedback') return json(route, { ok: true }, 201);
    if (method === 'GET' && pathname === '/api/notifications') {
      return json(route, {
        notifications: [
          {
            id: 'notification-1',
            type: 'item_drop',
            content: 'You found Warm Soup.',
            metadata: {},
            is_read: false,
            created_at: now,
          },
        ],
      });
    }
    if (method === 'PUT' && pathname === '/api/notifications/read') return empty(route);

    if (method === 'GET' && pathname === '/api/user/profile') return json(route, mockProfile);
    if (method === 'PATCH' && pathname === '/api/user/profile') {
      const body = route.request().postDataJSON() as Record<string, unknown> | null;
      return json(route, { ...mockProfile, ...(body ?? {}) });
    }
    if (method === 'POST' && pathname === '/api/user/change-password') return empty(route);
    if (method === 'DELETE' && pathname === '/api/user/account') return empty(route);

    if (method === 'POST' && pathname === '/api/focus/complete') {
      return json(route, {
        session_id: FOCUS_ID,
        coins_earned: 10,
        total_focus_time: 205,
      }, 201);
    }
    if (method === 'PATCH' && pathname === `/api/focus/${FOCUS_ID}/rating`) return empty(route);

    return json(route, { error: { code: 'UNMOCKED_ROUTE', message: `${method} ${pathname}` } }, 500);
  });
}

export async function captureForReport(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  await page.waitForTimeout(250);
  const dir = path.join(process.cwd(), 'reports', 'screenshots');
  await mkdir(dir, { recursive: true });
  const project = slug(testInfo.project.name);
  const filePath = path.join(dir, `${project}-${slug(name)}.png`);
  await page.screenshot({ path: filePath, fullPage: true, animations: 'disabled' });
  await testInfo.attach(`${name} screenshot`, {
    path: filePath,
    contentType: 'image/png',
  });
}

async function json(route: Route, data: unknown, status = 200): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(data),
  });
}

async function empty(route: Route): Promise<void> {
  await route.fulfill({ status: 204, body: '' });
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
