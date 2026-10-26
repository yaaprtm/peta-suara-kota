<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateReportStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        return $user && in_array($user->role, ['PETUGAS', 'ADMIN', 'SUPERADMIN']);
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', 'in:BARU,DIPROSES,SELESAI,DITOLAK'],
            'note' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'Status laporan wajib diisi',
            'status.in' => 'Status tidak valid',
        ];
    }
}
