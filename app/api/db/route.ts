import { NextRequest, NextResponse } from 'next/server';
import { serverDb } from '@/lib/server-db';
import { mySqlDb, testMySqlConnection, executeQuery, initMySqlSchema } from '@/lib/mysql-db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await mySqlDb.getAllData();
    const mysqlStatus = mySqlDb.getStatus();
    const users = await mySqlDb.getUsers();

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        users,
      },
      mysql: mysqlStatus,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Database read error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    switch (action) {
      case 'login': {
        const { username, password } = payload || {};
        const auth = await mySqlDb.authenticateUser(username, password);
        return NextResponse.json(auth);
      }

      case 'reset_password': {
        const { username, resetBy, newPassword } = payload || {};
        if (!username) {
          return NextResponse.json({ success: false, message: 'Username target wajib ditentukan' }, { status: 400 });
        }
        const result = await mySqlDb.resetPassword(username, resetBy || 'Administrator RME', newPassword);
        return NextResponse.json(result);
      }

      case 'add_queue': {
        const item = await mySqlDb.addQueue(payload);
        return NextResponse.json({ success: true, item });
      }

      case 'update_queue': {
        const { id, updates } = payload;
        await mySqlDb.updateQueue(id, updates);
        return NextResponse.json({ success: true });
      }

      case 'add_patient': {
        const patient = await mySqlDb.addPatient(payload);
        return NextResponse.json({ success: true, patient });
      }

      case 'update_config': {
        const config = serverDb.updateConfig(payload);
        return NextResponse.json({ success: true, config });
      }

      case 'add_security_log': {
        await mySqlDb.addSecurityLog(payload);
        return NextResponse.json({ success: true });
      }

      case 'add_bridging_log': {
        serverDb.addBridgingLog(payload);
        return NextResponse.json({ success: true });
      }

      case 'test_mysql': {
        const result = await testMySqlConnection(payload);
        return NextResponse.json({ success: true, result });
      }

      case 'query_mysql': {
        const { sql, params } = payload;
        try {
          const results = await executeQuery(sql, params || []);
          return NextResponse.json({ success: true, results });
        } catch (err: any) {
          return NextResponse.json({ success: false, error: err.message }, { status: 400 });
        }
      }

      case 'init_schema': {
        const result = await initMySqlSchema();
        return NextResponse.json(result);
      }

      case 'export_table': {
        const { table } = payload || {};
        const sql = mySqlDb.exportTableSql(table || 'queues');
        return NextResponse.json({ success: true, table, sql });
      }

      case 'export_full_dump': {
        const sql = mySqlDb.exportFullDumpSql();
        return NextResponse.json({ success: true, sql });
      }

      case 'get_schema': {
        const sql = mySqlDb.getSchemaSql();
        return NextResponse.json({ success: true, sql });
      }

      case 'get_procedures': {
        const sql = mySqlDb.getProceduresSql();
        return NextResponse.json({ success: true, sql });
      }

      case 'reset': {
        serverDb.reset();
        return NextResponse.json({ success: true, data: serverDb.getAll() });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Aksi tidak dikenali: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Database write error' },
      { status: 500 }
    );
  }
}
