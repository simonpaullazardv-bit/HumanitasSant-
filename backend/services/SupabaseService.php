<?php
namespace Humanitas\Backend\Services;

/**
 * Service Client HTTP REST pour Supabase
 */
class SupabaseService {

    private string $url;
    private string $apiKey;

    public function __construct() {
        $this->url = getenv('SUPABASE_URL') ?: 'https://your-supabase-project.supabase.co';
        $this->apiKey = getenv('SUPABASE_ANON_KEY') ?: 'your-anon-key';
    }

    public function query(string $endpoint, string $method = 'GET', array $body = [], array $headers = []): array {
        $ch = curl_init("{$this->url}/rest/v1/{$endpoint}");
        $defaultHeaders = [
            'apikey: ' . $this->apiKey,
            'Authorization: Bearer ' . $this->apiKey,
            'Content-Type: application/json',
            'Prefer: return=representation'
        ];

        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_HTTPHEADER, array_merge($defaultHeaders, $headers));

        if (in_array($method, ['POST', 'PATCH', 'PUT']) && !empty($body)) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return [
            'statusCode' => $httpCode,
            'data' => json_decode($response, true)
        ];
    }
}
