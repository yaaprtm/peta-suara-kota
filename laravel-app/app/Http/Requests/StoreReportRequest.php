<?php

namespace App\Http\Requests;

use App\Models\Category;
use Illuminate\Foundation\Http\FormRequest;

class StoreReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        if (!$this->has('category') && $this->filled('categoryId')) {
            $cat = Category::find($this->input('categoryId'));
            if ($cat) {
                $this->merge(['category' => $cat->type]);
            }
        }
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'min:5', 'max:200'],
            'description' => ['required', 'string', 'min:10'],
            'category' => ['required', 'string', 'in:INFRASTRUKTUR,KEBERSIHAN,KEAMANAN,BANJIR,LAINNYA'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'address' => ['nullable', 'string', 'max:500'],
            'kelurahanId' => ['nullable', 'string', 'exists:kelurahans,id'],
            'audioTranscript' => ['nullable', 'string'],
            'photos' => ['nullable', 'array', 'max:4'],
            'photos.*' => ['file', 'mimes:jpeg,jpg,png,webp', 'max:10240'],
            'audio' => ['nullable', 'file', 'mimes:mp3,wav,ogg,m4a,webm', 'max:10240'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Judul laporan wajib diisi',
            'title.min' => 'Judul laporan minimal 5 karakter',
            'title.max' => 'Judul laporan maksimal 200 karakter',
            'description.required' => 'Deskripsi laporan wajib diisi',
            'description.min' => 'Deskripsi laporan minimal 10 karakter',
            'category.required' => 'Kategori laporan wajib dipilih',
            'category.in' => 'Kategori tidak valid',
            'latitude.required' => 'Koordinat latitude wajib ditentukan',
            'latitude.between' => 'Koordinat latitude harus berada dalam wilayah Kota Surabaya (-7.45 s/d -7.10)',
            'longitude.required' => 'Koordinat longitude wajib ditentukan',
            'longitude.between' => 'Koordinat longitude harus berada dalam wilayah Kota Surabaya (112.50 s/d 112.95)',
            'photos.max' => 'Maksimal 4 foto yang dapat diunggah',
            'photos.*.max' => 'Ukuran setiap foto maksimal 10MB',
            'audio.max' => 'Ukuran file audio maksimal 10MB',
        ];
    }
}
