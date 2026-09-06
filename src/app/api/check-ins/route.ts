export async function POST() {
  return Response.json({ error: 'ไม่ต้องเช็กอินเข้างาน' }, { status: 410 });
}
