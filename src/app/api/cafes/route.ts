import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src', 'data', 'data.json');

export async function GET() {
  try {
    const fileContent = await fs.readFile(dataFilePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return NextResponse.json({ success: true, cafes: data.cafes || [] });
  } catch (error) {
    console.error('Error reading data.json:', error);
    return NextResponse.json({ success: false, error: 'Failed to read data' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const newCafeData = await req.json();
    
    // Read existing data
    const fileContent = await fs.readFile(dataFilePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    if (!data.cafes) {
      data.cafes = [];
    }
    
    // Generate a dummy password since we're mocking email delivery
    const generatedPassword = Math.random().toString(36).slice(-8);

    // Assign an ID if not provided and map email to username
    const cafeToSave = {
      id: `cafe-${Date.now().toString().slice(-6)}`,
      createdAt: Date.now(),
      name: newCafeData.name,
      location: newCafeData.location,
      ownerName: newCafeData.ownerName,
      username: newCafeData.email,
      password: generatedPassword
    };
    
    data.cafes.push(cafeToSave);
    
    // Write back
    await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
    
    return NextResponse.json({ 
      success: true, 
      cafe: cafeToSave,
      // For local testing dummy popup
      dummyPassword: generatedPassword 
    });
  } catch (error) {
    console.error('Error writing to data.json:', error);
    return NextResponse.json({ success: false, error: 'Failed to write data' }, { status: 500 });
  }
}
