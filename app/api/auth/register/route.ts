import bcrypt from "bcryptjs";

export async function POST(req:Request){
  try {
    const {name, email, password}= await req.json()

    if(!name || !email || !password){
      return Response.json({error:"All fields are required "},{status:400})
    }

    if(password.length < 6){
      return Response.json({error:"Password must be greater than 6 char"},{status:400})
    }

    const existingUser = await prisma.user.findUnique({where:{email}})

    if(existingUser){
      return Response.json({error:"Email already registered hai"},{status:409})
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data:{
        name,
        email,
        password:hashedPassword,
        provider:"credentials",
      },
      select:{
        id:true,
        name:true, 
        email:true
      }
    })

    return Response.json({message:"Account has been be created"}, {status:201})
    
  } catch (error) {
    console.error("galt ha kuch :", error)
    return Response.json({error:"somenthing went wrong"},{status:500})
    
  }
}