use anchor_lang::prelude::*;

/**
* Initializes a new user account
*/
pub fn initialize_user_account(ctx: Context<InitializeUserAccount>) -> Result<()> {
    let user_account = &mut ctx.accounts.user_account;
    user_account.authority = ctx.accounts.user.key();

    Ok(())
}

#[derive(Accounts)]
pub struct InitializeUserAccount<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + 32,
        seeds = [b"user_account", user.key().as_ref()], // PDA from string and user wallet pubkey
        bump
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(mut)]
    pub admin: Signer<'info>, //  admin pubkey, which pays for the transaction
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub user: UncheckedAccount<'info>, // user wallet pubkey

    // system
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[account]
pub struct UserAccount {

    // User wallet pub key
    pub authority: Pubkey,
    // pub assciated_gems_token_account: Pubkey,
}

// #[account]
// pub struct TokenAccount {
//     pub owner: Pubkey,
//     pub amount: u64,
// }