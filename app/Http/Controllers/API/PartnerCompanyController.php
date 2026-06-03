<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\PartnerCompany;
use Illuminate\Http\Request;

class PartnerCompanyController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = PartnerCompany::query();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('address', 'like', "%{$search}%");
            });
        }

        if ($request->boolean('all')) {
            return response()->json($query->orderBy('name', 'asc')->get());
        }

        return response()->json($query->orderBy('name', 'asc')->paginate(15));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:partner_companies,name',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $company = PartnerCompany::create($validated);

        return response()->json($company, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(PartnerCompany $partnerCompany)
    {
        return response()->json($partnerCompany);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, PartnerCompany $partnerCompany)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:partner_companies,name,' . $partnerCompany->id,
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $partnerCompany->update($validated);

        return response()->json($partnerCompany);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(PartnerCompany $partnerCompany)
    {
        $partnerCompany->delete();
        return response()->json(null, 204);
    }
}
