import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create categories
    const categories = [
      { name: 'Tracking Devices' },
      { name: 'Accessories' },
      { name: 'Hardware' },
      { name: 'Electronics' },
      { name: 'Installation Parts' }
    ];

    const { data: createdCategories, error: catError } = await supabase
      .from('categories')
      .upsert(categories, { onConflict: 'name' })
      .select();

    if (catError) {
      return NextResponse.json({ error: catError.message }, { status: 500 });
    }

    // Create sample parts
    const sampleParts = [
      {
        category_id: createdCategories[0].id,
        item_code: 'TRK001',
        description: 'GPS Tracker Model A',
        price: 1250.00,
        quantity: 25
      },
      {
        category_id: createdCategories[0].id,
        item_code: 'TRK002',
        description: 'GPS Tracker Model B',
        price: 1850.00,
        quantity: 15
      },
      {
        category_id: createdCategories[1].id,
        item_code: 'ACC001',
        description: 'Magnetic Mount',
        price: 85.00,
        quantity: 50
      },
      {
        category_id: createdCategories[1].id,
        item_code: 'ACC002',
        description: 'External Antenna',
        price: 125.00,
        quantity: 30
      },
      {
        category_id: createdCategories[2].id,
        item_code: 'HW001',
        description: 'Mounting Bracket',
        price: 45.00,
        quantity: 40
      },
      {
        category_id: createdCategories[2].id,
        item_code: 'HW002',
        description: 'Wiring Harness',
        price: 95.00,
        quantity: 35
      },
      {
        category_id: createdCategories[3].id,
        item_code: 'ELC001',
        description: 'Power Cable',
        price: 65.00,
        quantity: 60
      },
      {
        category_id: createdCategories[4].id,
        item_code: 'INS001',
        description: 'Installation Kit',
        price: 185.00,
        quantity: 20
      }
    ];

    // Add total calculation
    const partsWithTotal = sampleParts.map(part => ({
      ...part,
      total: part.price * part.quantity
    }));

    const { data: createdParts, error: partsError } = await supabase
      .from('parts')
      .upsert(partsWithTotal, { onConflict: 'item_code' })
      .select();

    if (partsError) {
      return NextResponse.json({ error: partsError.message }, { status: 500 });
    }

    // Create initial inventory logs
    const initialLogs = createdParts.map(part => ({
      part_id: part.id,
      change_type: 'add',
      quantity_change: part.quantity
    }));

    const { error: logsError } = await supabase
      .from('inventory_logs')
      .insert(initialLogs);

    if (logsError) {
      return NextResponse.json({ error: logsError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Seed data created successfully',
      categories: createdCategories.length,
      parts: createdParts.length,
      logs: initialLogs.length
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}