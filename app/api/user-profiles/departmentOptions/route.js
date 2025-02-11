import { db } from '@/utils/db';

export async function POST(request) {
    const { facultyId } = await request.json();
    const results = await db.query('SELECT rc_dep_pid, rc_dep_name FROM rc_department WHERE rc_dep_fac_pid = ?', [facultyId]);
    return new Response(JSON.stringify(results));
}
