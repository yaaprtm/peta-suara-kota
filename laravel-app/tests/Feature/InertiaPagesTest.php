<?php

namespace Tests\Feature;

use Tests\TestCase;
use Inertia\Testing\AssertableInertia as Assert;

class InertiaPagesTest extends TestCase
{
    public function test_landing_page_renders_successfully(): void
    {
        $response = $this->get('/');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Landing'));
    }

    public function test_map_page_renders_successfully(): void
    {
        $response = $this->get('/peta');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('MapPage'));
    }

    public function test_leaderboard_page_renders_successfully(): void
    {
        $response = $this->get('/leaderboard');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Leaderboard'));
    }

    public function test_login_page_renders_successfully(): void
    {
        $response = $this->get('/login');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Auth/Login'));
    }

    public function test_register_page_renders_successfully(): void
    {
        $response = $this->get('/register');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Auth/Register'));
    }

    public function test_dashboard_page_renders_successfully(): void
    {
        $response = $this->get('/dashboard');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Dashboard'));
    }

    public function test_petugas_dashboard_page_renders_successfully(): void
    {
        $response = $this->get('/petugas');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Petugas/Dashboard'));
    }

    public function test_superadmin_dashboard_page_renders_successfully(): void
    {
        $response = $this->get('/superadmin');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Admin/Dashboard'));
    }

    public function test_master_data_page_renders_successfully(): void
    {
        $response = $this->get('/superadmin/master');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page->component('Admin/MasterData'));
    }

    public function test_report_detail_page_renders_successfully(): void
    {
        $response = $this->get('/laporan/test-uuid-123');
        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => 
            $page->component('Reports/Show')
                 ->where('id', 'test-uuid-123')
        );
    }
}
