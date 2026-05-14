import { NextResponse } from "next/server";

const salt = bcrypt.genSaltSync(10);

export const POST = async (req: Request) => {
  try {
    const { name, email, password, phoneNumber } = await req.json();
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return NextResponse.json({
        status: 400,
        message: "The user is already existing",
      });
    }
    const hashedPassword = bcrypt.hashSync(password, salt);
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;
    const newUser = {
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      image: avatarUrl,
    };
    const createdUser = await User.create(newUser);
    return NextResponse.json({
      status: 201,
      data: createdUser,
      message: "user created successfully",
    });
  } catch (error) {
    return NextResponse.json({
      status: 500,
      message: `A critical error ocurred. Error: ${error}`,
    });
  }
};
