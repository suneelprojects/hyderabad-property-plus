<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Settings → HRC WhatsApp
 * Stores config in one `hrc_wa_settings` option (autoload=no).
 * Secrets never surface via REST — they're only read server-side.
 */
class HRC_WA_Settings {

	const PAGE_SLUG = 'hrc-whatsapp';
	const NONCE     = 'hrc_wa_settings_save';

	public static function init(): void {
		add_action( 'admin_menu', [ __CLASS__, 'menu' ] );
		add_action( 'admin_post_hrc_wa_save', [ __CLASS__, 'handle_save' ] );
	}

	public static function install_defaults(): void {
		if ( get_option( HRC_WA_OPTION ) ) return;
		add_option( HRC_WA_OPTION, self::defaults(), '', 'no' );
	}

	public static function defaults(): array {
		return [
			'enabled'                => 1,
			'provider'               => 'click_to_chat',
			'sales_number'           => '',
			'notify_email'           => get_option( 'admin_email' ),
			'notification_template'  => HRC_WA_Templates::default_notification(),
			'customer_reply_template'=> HRC_WA_Templates::default_customer_reply(),
			'cloud_phone_number_id'  => '',
			'cloud_access_token'     => '', // prefer HRC_WA_CLOUD_TOKEN constant in wp-config
			'cloud_template_name'    => '',
			'cloud_template_lang'    => 'en_US',
		];
	}

	public static function get(): array {
		$saved = get_option( HRC_WA_OPTION, [] );
		return array_merge( self::defaults(), is_array( $saved ) ? $saved : [] );
	}

	public static function menu(): void {
		add_options_page(
			'HRC WhatsApp',
			'HRC WhatsApp',
			'manage_options',
			self::PAGE_SLUG,
			[ __CLASS__, 'render' ]
		);
	}

	public static function handle_save(): void {
		if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Forbidden' );
		check_admin_referer( self::NONCE );

		$in  = wp_unslash( $_POST['hrc_wa'] ?? [] );
		$cur = self::get();

		$new = [
			'enabled'                 => ! empty( $in['enabled'] ) ? 1 : 0,
			'provider'                => sanitize_key( $in['provider'] ?? 'click_to_chat' ),
			'sales_number'            => sanitize_text_field( $in['sales_number'] ?? '' ),
			'notify_email'            => sanitize_email( $in['notify_email'] ?? '' ),
			'notification_template'   => wp_kses_post( $in['notification_template'] ?? '' ),
			'customer_reply_template' => wp_kses_post( $in['customer_reply_template'] ?? '' ),
			'cloud_phone_number_id'   => sanitize_text_field( $in['cloud_phone_number_id'] ?? '' ),
			'cloud_template_name'     => sanitize_text_field( $in['cloud_template_name'] ?? '' ),
			'cloud_template_lang'     => sanitize_text_field( $in['cloud_template_lang'] ?? 'en_US' ),
			// Leave token untouched if left blank; allows read-once semantics.
			'cloud_access_token'      => $in['cloud_access_token'] !== ''
				? sanitize_text_field( $in['cloud_access_token'] )
				: $cur['cloud_access_token'],
		];

		update_option( HRC_WA_OPTION, $new, 'no' );

		wp_safe_redirect( add_query_arg(
			[ 'page' => self::PAGE_SLUG, 'saved' => 1 ],
			admin_url( 'options-general.php' )
		) );
		exit;
	}

	public static function render(): void {
		if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Forbidden' );
		$s = self::get();
		$providers = HRC_WA_Notifier::providers();
		$tokens = '{{name}} {{phone}} {{email}} {{project}} {{location}} {{visit_date}} {{message}} {{source}} {{submitted_at}}';
		$token_defined = defined( 'HRC_WA_CLOUD_TOKEN' );
		?>
		<div class="wrap">
			<h1>HRC WhatsApp</h1>
			<?php if ( ! empty( $_GET['saved'] ) ) : ?>
				<div class="notice notice-success is-dismissible"><p>Settings saved.</p></div>
			<?php endif; ?>

			<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
				<input type="hidden" name="action" value="hrc_wa_save">
				<?php wp_nonce_field( self::NONCE ); ?>

				<table class="form-table" role="presentation">
					<tr>
						<th scope="row">Notifications</th>
						<td>
							<label><input type="checkbox" name="hrc_wa[enabled]" value="1" <?php checked( $s['enabled'], 1 ); ?>> Enable WhatsApp lead notifications</label>
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="hrc_wa_provider">Provider</label></th>
						<td>
							<select id="hrc_wa_provider" name="hrc_wa[provider]">
								<?php foreach ( $providers as $id => $p ) : ?>
									<option value="<?php echo esc_attr( $id ); ?>" <?php selected( $s['provider'], $id ); ?>>
										<?php echo esc_html( $p->label() ); ?>
									</option>
								<?php endforeach; ?>
							</select>
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="hrc_wa_sales">Sales WhatsApp Number</label></th>
						<td>
							<input type="text" id="hrc_wa_sales" name="hrc_wa[sales_number]" class="regular-text"
								value="<?php echo esc_attr( $s['sales_number'] ); ?>" placeholder="+91 90000 00000">
							<p class="description">Country code is added automatically for bare 10-digit Indian numbers.</p>
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="hrc_wa_email">Notification Email (fallback)</label></th>
						<td>
							<input type="email" id="hrc_wa_email" name="hrc_wa[notify_email]" class="regular-text"
								value="<?php echo esc_attr( $s['notify_email'] ); ?>">
							<p class="description">Used by the Click-to-Chat provider to email the sales team.</p>
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="hrc_wa_tpl">Notification Template</label></th>
						<td>
							<textarea id="hrc_wa_tpl" name="hrc_wa[notification_template]" rows="10" class="large-text code"><?php
								echo esc_textarea( $s['notification_template'] );
							?></textarea>
							<p class="description">Tokens: <code><?php echo esc_html( $tokens ); ?></code></p>
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="hrc_wa_reply">Customer Reply Template</label></th>
						<td>
							<textarea id="hrc_wa_reply" name="hrc_wa[customer_reply_template]" rows="6" class="large-text code"><?php
								echo esc_textarea( $s['customer_reply_template'] );
							?></textarea>
							<p class="description">Used by the "WhatsApp Customer" action in the Leads list.</p>
						</td>
					</tr>
				</table>

				<h2>Meta WhatsApp Cloud API</h2>
				<p>Only required if Provider is set to <em>Meta WhatsApp Cloud API</em>.</p>
				<table class="form-table" role="presentation">
					<tr>
						<th scope="row"><label for="hrc_wa_cloud_id">Phone Number ID</label></th>
						<td><input type="text" id="hrc_wa_cloud_id" name="hrc_wa[cloud_phone_number_id]" class="regular-text"
							value="<?php echo esc_attr( $s['cloud_phone_number_id'] ); ?>"></td>
					</tr>
					<tr>
						<th scope="row"><label for="hrc_wa_cloud_token">Access Token</label></th>
						<td>
							<?php if ( $token_defined ) : ?>
								<p><code>HRC_WA_CLOUD_TOKEN</code> constant is defined in <code>wp-config.php</code> — that value is used and this field is ignored.</p>
							<?php else : ?>
								<input type="password" id="hrc_wa_cloud_token" name="hrc_wa[cloud_access_token]" class="regular-text"
									value="" autocomplete="new-password"
									placeholder="<?php echo $s['cloud_access_token'] ? '•••••• (leave blank to keep)' : ''; ?>">
								<p class="description">Prefer defining <code>HRC_WA_CLOUD_TOKEN</code> in <code>wp-config.php</code>.</p>
							<?php endif; ?>
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="hrc_wa_tpl_name">Template Name</label></th>
						<td><input type="text" id="hrc_wa_tpl_name" name="hrc_wa[cloud_template_name]" class="regular-text"
							value="<?php echo esc_attr( $s['cloud_template_name'] ); ?>"></td>
					</tr>
					<tr>
						<th scope="row"><label for="hrc_wa_tpl_lang">Template Language</label></th>
						<td><input type="text" id="hrc_wa_tpl_lang" name="hrc_wa[cloud_template_lang]" class="small-text"
							value="<?php echo esc_attr( $s['cloud_template_lang'] ); ?>"></td>
					</tr>
				</table>

				<?php submit_button( 'Save Settings' ); ?>
			</form>
		</div>
		<?php
	}
}
