require("dotenv").config?.();
const express=require("express");
const http=require("http");
const WebSocket=require("ws");
const {Pool}=require("pg");
const bcrypt=require("bcryptjs");
const jwt=require("jsonwebtoken");
const QRCode=require("qrcode");
const fs=require("fs");
const path=require("path");

const PORT=process.env.PORT||3000;
const JWT_SECRET=process.env.JWT_SECRET||"change-me";
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_URL?.includes("localhost")?false:{rejectUnauthorized:false}});
const app=express(), server=http.createServer(app), wss=new WebSocket.Server({server});
app.use(express.json());
app.use(express.static(path.join(__dirname,"public")));

const schema=fs.readFileSync(path.join(__dirname,"schema.sql"),"utf8");
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function init(){
  await pool.query(schema);
  await pool.query("ALTER TABLE admins ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE");
  const admin=await pool.query("SELECT id FROM admins WHERE username=$1",[process.env.ADMIN_USER||"admin"]);
  if(!admin.rowCount){
    const hash=await bcrypt.hash(process.env.ADMIN_PASSWORD||"admin123",12);
    await pool.query("INSERT INTO admins(username,password_hash) VALUES($1,$2)",[process.env.ADMIN_USER||"admin",hash]);
  }
}
function cat(count){if(count>=2&&count<=3)return"23";if(count>=4&&count<=5)return"45";if(count>=6&&count<=7)return"67";if(count>=10)return"10";return null}
function tokenFor(admin){return jwt.sign({id:admin.id,username:admin.username},JWT_SECRET,{expiresIn:"12h"})}
function auth(req,res,next){try{req.admin=jwt.verify((req.headers.authorization||"").replace("Bearer ",""),JWT_SECRET);next()}catch{return res.status(401).json({error:"Não autorizado"})}}
async function broadcast(){
  const waiting=(await pool.query("SELECT * FROM tickets WHERE status='waiting' ORDER BY priority DESC, created_at ASC")).rows;
  const called=(await pool.query("SELECT * FROM tickets WHERE status='called' ORDER BY called_at DESC LIMIT 100")).rows;
  const payload=JSON.stringify({type:"state",state:{waiting,called}});
  wss.clients.forEach(c=>{if(c.readyState===WebSocket.OPEN)c.send(payload)});
}
wss.on("connection",async ws=>{await broadcast()});

app.post("/api/login",async(req,res)=>{
  const {username,password}=req.body||{};
  const r=await pool.query("SELECT * FROM admins WHERE username=$1 AND active=TRUE",[username||""]);
  if(!r.rowCount||!(await bcrypt.compare(password||"",r.rows[0].password_hash)))return res.status(401).json({error:"Usuário ou senha inválidos"});
  res.json({token:tokenFor(r.rows[0]),username:r.rows[0].username});
});

app.get("/api/admins",auth,async(req,res)=>{
  const rows=(await pool.query("SELECT id,username,active,created_at FROM admins ORDER BY username")).rows;
  res.json(rows);
});
app.post("/api/admins",auth,async(req,res)=>{
  const {username,password}=req.body||{};
  const u=String(username||"").trim();
  if(!/^[A-Za-z0-9._-]{3,40}$/.test(u)) return res.status(400).json({error:"Usuário inválido. Use 3–40 caracteres: letras, números, ponto, hífen ou sublinhado."});
  if(!password || password.length<8) return res.status(400).json({error:"A senha deve ter pelo menos 8 caracteres."});
  try{
    const hash=await bcrypt.hash(password,12);
    const row=(await pool.query("INSERT INTO admins(username,password_hash,active) VALUES($1,$2,TRUE) RETURNING id,username,active,created_at",[u,hash])).rows[0];
    res.json(row);
  }catch(e){ if(e.code==="23505") return res.status(409).json({error:"Esse usuário já existe."}); res.status(500).json({error:"Não foi possível criar o usuário."});}
});
app.patch("/api/admins/:id",auth,async(req,res)=>{
  const id=Number(req.params.id);
  if(!Number.isInteger(id)) return res.status(400).json({error:"Administrador inválido."});
  if(req.body?.active===false && id===req.admin.id) return res.status(400).json({error:"Você não pode desativar o próprio usuário."});
  if(req.body?.active===false){
    const activeCount=Number((await pool.query("SELECT COUNT(*) FROM admins WHERE active=TRUE")).rows[0].count);
    if(activeCount<=1) return res.status(400).json({error:"Mantenha pelo menos um administrador ativo."});
  }
  if(req.body?.password!==undefined){
    if(String(req.body.password).length<8) return res.status(400).json({error:"A senha deve ter pelo menos 8 caracteres."});
    const hash=await bcrypt.hash(String(req.body.password),12);
    await pool.query("UPDATE admins SET password_hash=$1 WHERE id=$2",[hash,id]);
  }
  if(req.body?.active!==undefined) await pool.query("UPDATE admins SET active=$1 WHERE id=$2",[!!req.body.active,id]);
  const row=(await pool.query("SELECT id,username,active,created_at FROM admins WHERE id=$1",[id])).rows[0];
  if(!row) return res.status(404).json({error:"Administrador não encontrado."});
  res.json(row);
});
app.get("/api/state",async(req,res)=>{
  const waiting=(await pool.query("SELECT * FROM tickets WHERE status='waiting' ORDER BY priority DESC,created_at ASC")).rows;
  const called=(await pool.query("SELECT * FROM tickets WHERE status='called' ORDER BY called_at DESC LIMIT 100")).rows;
  res.json({waiting,called});
});
app.post("/api/tickets",async(req,res)=>{
  const count=Number(req.body.count), category=cat(count), priority=!!req.body.priority;
  if(!category)return res.status(400).json({error:"Quantidade inválida. Use 2–3, 4–5, 6–7 ou 10+."});
  const reason=priority?(req.body.priorityReason==="idoso"?"60+ anos":"Pessoa com deficiência/necessidade especial"):null;
  const prefix="B";
  const client=await pool.connect();
  try{
    await client.query("BEGIN");
    const n=(await client.query("SELECT COALESCE(MAX(id),0)+1 AS n FROM tickets")).rows[0].n;
    const ticket=prefix+String(n).padStart(3,"0");
    const row=(await client.query("INSERT INTO tickets(ticket,people_count,category,priority,priority_reason) VALUES($1,$2,$3,$4,$5) RETURNING *",[ticket,count,category,priority,reason])).rows[0];
    await client.query("COMMIT"); res.json(row); broadcast();
  }catch(e){await client.query("ROLLBACK");res.status(500).json({error:"Não foi possível entrar na fila"})}finally{client.release()}
});
app.delete("/api/tickets/:ticket",async(req,res)=>{
  await pool.query("UPDATE tickets SET status='cancelled',cancelled_at=NOW() WHERE ticket=$1 AND status='waiting'",[req.params.ticket]);
  res.json({ok:true});broadcast();
});
app.post("/api/call",auth,async(req,res)=>{
  const category=String(req.body.category);
  const r=await pool.query("SELECT * FROM tickets WHERE status='waiting' AND category=$1 ORDER BY priority DESC,created_at ASC LIMIT 1",[category]);
  if(!r.rowCount)return res.status(404).json({error:"Não há clientes nesta fila"});
  const row=(await pool.query("UPDATE tickets SET status='called',called_at=NOW() WHERE id=$1 RETURNING *",[r.rows[0].id])).rows[0];
  res.json(row);broadcast();
});
app.post("/api/serve/:ticket",auth,async(req,res)=>{
  await pool.query("UPDATE tickets SET status='served',served_at=NOW() WHERE ticket=$1 AND status='called'",[req.params.ticket]);res.json({ok:true});broadcast();
});
app.post("/api/reset",auth,async(req,res)=>{
  await pool.query("UPDATE tickets SET status='cancelled',cancelled_at=NOW() WHERE status IN ('waiting','called')");res.json({ok:true});broadcast();
});
app.get("/api/qr",async(req,res)=>{
  const target=(process.env.PUBLIC_URL||`${req.protocol}://${req.get("host")}`)+"/";
  res.type("png").send(await QRCode.toBuffer(target,{width:900,margin:2,color:{dark:"#111214",light:"#ffffff"}}));
});
app.get("/api/config",(req,res)=>res.json({restaurantName:process.env.RESTAURANT_NAME||"Bahrem Burger & Grill"}));
app.get("*",(req,res)=>res.sendFile(path.join(__dirname,"public","index.html")));

init().then(()=>server.listen(PORT,()=>console.log(`Bahrem Fila em http://localhost:${PORT}`))).catch(e=>{console.error(e);process.exit(1)});
