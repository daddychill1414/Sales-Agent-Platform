import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient, verifyAdmin } from '@/lib/admin';

/**
 * GET /api/admin/articles
 * List all news/knowledge articles.
 */
export async function GET() {
    const auth = await verifyAdmin();
    if (auth instanceof NextResponse) return auth;

    const db = createAdminClient();

    try {
        const { data, error } = await db
            .from('news_articles')
            .select('*, author:profiles!author_id(full_name, first_name, last_name)')
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const articles = (data || []).map(a => ({
            ...a,
            authorName: a.author?.full_name || `${a.author?.first_name || ''} ${a.author?.last_name || ''}`.trim() || 'Unknown',
        }));

        return NextResponse.json({ articles });
    } catch (err) {
        console.error('Articles fetch error:', err);
        return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
    }
}

/**
 * POST /api/admin/articles
 * Create a new article. Body: { title, content }
 */
export async function POST(request: NextRequest) {
    const auth = await verifyAdmin();
    if (auth instanceof NextResponse) return auth;

    const db = createAdminClient();

    try {
        const body = await request.json();
        const { title, content } = body;

        if (!title || !content) {
            return NextResponse.json({ error: 'Title and content required' }, { status: 400 });
        }

        const { data, error } = await db
            .from('news_articles')
            .insert({ title, content, author_id: auth.userId })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, article: data });
    } catch (err) {
        console.error('Article create error:', err);
        return NextResponse.json({ error: 'Failed to create article' }, { status: 500 });
    }
}

/**
 * PUT /api/admin/articles
 * Update an article. Body: { id, title?, content? }
 */
export async function PUT(request: NextRequest) {
    const auth = await verifyAdmin();
    if (auth instanceof NextResponse) return auth;

    const db = createAdminClient();

    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Article id required' }, { status: 400 });
        }

        const { data, error } = await db
            .from('news_articles')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, article: data });
    } catch (err) {
        console.error('Article update error:', err);
        return NextResponse.json({ error: 'Failed to update article' }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/articles
 * Delete an article. Body: { id }
 */
export async function DELETE(request: NextRequest) {
    const auth = await verifyAdmin();
    if (auth instanceof NextResponse) return auth;

    const db = createAdminClient();

    try {
        const body = await request.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ error: 'Article id required' }, { status: 400 });
        }

        const { error } = await db.from('news_articles').delete().eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Article delete error:', err);
        return NextResponse.json({ error: 'Failed to delete article' }, { status: 500 });
    }
}
